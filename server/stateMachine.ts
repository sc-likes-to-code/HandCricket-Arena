import { GameRoom, GameState, Player, MoveRecord } from './types';

export class GameStateMachine {
  /**
   * Helper to validate state transitions
   */
  public static canTransition(current: GameState, target: GameState): boolean {
    const validTransitions: Record<GameState, GameState[]> = {
      WAITING: ['LOBBY'],
      LOBBY: ['READY', 'WAITING'],
      READY: ['TOSS', 'LOBBY'],
      TOSS: ['BAT_OR_BOWL', 'LOBBY'],
      BAT_OR_BOWL: ['FIRST_INNINGS', 'LOBBY'],
      FIRST_INNINGS: ['CHANGE_INNINGS', 'RESULT', 'LOBBY'], // in case of forfeit or normal play
      CHANGE_INNINGS: ['SECOND_INNINGS', 'LOBBY'],
      SECOND_INNINGS: ['RESULT', 'LOBBY'],
      RESULT: ['REMATCH', 'LOBBY'],
      REMATCH: ['TOSS', 'LOBBY'],
    };

    return validTransitions[current].includes(target);
  }

  /**
   * Safe transition method that throws on illegal actions
   */
  public static transitionTo(room: GameRoom, target: GameState) {
    if (!this.canTransition(room.status, target)) {
      throw new Error(`Illegal state transition from ${room.status} to ${target}`);
    }
    room.status = target;
    room.lastActive = Date.now();
  }

  /**
   * Executes the coin flip for the toss phase
   */
  public static handleCoinToss(room: GameRoom, prediction: 'heads' | 'tails'): { winnerId: string; result: 'heads' | 'tails' } {
    if (room.status !== 'TOSS') {
      throw new Error('Coin flip can only happen in TOSS state');
    }

    const host = room.players.find((p) => p.isHost);
    const guest = room.players.find((p) => !p.isHost);

    if (!host || !guest) {
      throw new Error('Toss requires two players');
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === prediction;
    const winnerId = won ? guest.id : host.id;

    room.coinFlipResult = result;
    room.tossPrediction = prediction;
    room.tossWinnerId = winnerId;
    
    this.transitionTo(room, 'BAT_OR_BOWL');
    return { winnerId, result };
  }

  /**
   * Registers whether the toss winner wants to Bat or Bowl
   */
  public static handleTossDecision(room: GameRoom, deciderId: string, choice: 'bat' | 'bowl') {
    if (room.status !== 'BAT_OR_BOWL') {
      throw new Error('Toss decision can only happen in BAT_OR_BOWL state');
    }

    if (room.tossWinnerId !== deciderId) {
      throw new Error('Only the toss winner can make the decision');
    }

    const decider = room.players.find((p) => p.id === deciderId);
    const opponent = room.players.find((p) => p.id !== deciderId);

    if (!decider || !opponent) {
      throw new Error('Players not found');
    }

    room.tossChoice = choice;

    if (choice === 'bat') {
      room.batterId = decider.id;
      room.bowlerId = opponent.id;
    } else {
      room.batterId = opponent.id;
      room.bowlerId = decider.id;
    }

    // Reset scores & game states for first innings
    room.players.forEach((p) => {
      p.score = 0;
      p.wickets = 0;
      p.currentChoice = null;
      p.playAgain = null;
    });
    room.moves = [];
    room.lastTurnResult = null;
    room.targetRuns = null;

    this.transitionTo(room, 'FIRST_INNINGS');
  }

  /**
   * Registers a choice for a player.
   * If both choices are submitted, resolves the turn.
   */
  public static submitChoice(
    room: GameRoom,
    playerId: string,
    choice: number
  ): { resolved: boolean; revealTime?: number } {
    if (room.status !== 'FIRST_INNINGS' && room.status !== 'SECOND_INNINGS') {
      throw new Error('Moves can only be submitted during active innings');
    }

    if (choice < 1 || choice > 6) {
      throw new Error('Move choice must be between 1 and 6');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not in this room');
    }

    player.currentChoice = choice;
    room.lastActive = Date.now();

    // Check if both players have submitted
    const bothSubmitted = room.players.every((p) => p.currentChoice !== null);

    if (bothSubmitted) {
      // Calculate a reveal time timestamp in the future (e.g. 500ms server processing + 2000ms countdown/shake duration)
      // We will let client handle shake & reveal animations starting from a specific target epoch
      const serverTime = Date.now();
      const shakeCushionMs = 2500; // 2.5 seconds (countdown + shake animation)
      room.revealTime = serverTime + shakeCushionMs;

      return { resolved: true, revealTime: room.revealTime };
    }

    return { resolved: false };
  }

  /**
   * Authoritatively resolves the active choices, calculating score increases or outs.
   * Called on the server after the reveal timestamp buffer expires or when confirming state.
   */
  public static resolveTurn(room: GameRoom): {
    batterChoice: number;
    bowlerChoice: number;
    runsAdded: number;
    isOut: boolean;
    inningsOver: boolean;
    gameOver: boolean;
    winnerId: string | null;
  } {
    const host = room.players.find((p) => p.isHost);
    const guest = room.players.find((p) => !p.isHost);
    const batter = room.players.find((p) => p.id === room.batterId);
    const bowler = room.players.find((p) => p.id === room.bowlerId);

    if (!batter || !bowler || !host || !guest) {
      throw new Error('Missing batter or bowler roles');
    }

    const batChoice = batter.currentChoice;
    const bowlChoice = bowler.currentChoice;

    if (batChoice === null || bowlChoice === null) {
      throw new Error('Not all choices submitted');
    }

    const turnNumber = room.moves.length + 1;
    const isOut = batChoice === bowlChoice;
    const runsAdded = isOut ? 0 : batChoice;

    if (!isOut) {
      batter.score += runsAdded;
    } else {
      batter.wickets += 1;
    }

    // Record move
    const record: MoveRecord = {
      turnNumber,
      batterChoice: batChoice,
      bowlerChoice: bowlChoice,
      runsAdded,
      isOut,
      batterId: batter.id,
    };
    room.moves.push(record);
    room.lastTurnResult = {
      batterChoice: batChoice,
      bowlerChoice: bowlChoice,
      runsAdded,
      isOut,
      batterId: batter.id,
    };

    // Reset current choices
    room.players.forEach((p) => (p.currentChoice = null));

    let inningsOver = false;
    let gameOver = false;
    let winnerId: string | null = null;

    if (room.status === 'FIRST_INNINGS') {
      if (isOut) {
        inningsOver = true;
        room.targetRuns = batter.score + 1;
        
        // Swap batter and bowler
        room.batterId = bowler.id;
        room.bowlerId = batter.id;
        this.transitionTo(room, 'CHANGE_INNINGS');
      }
    } else if (room.status === 'SECOND_INNINGS') {
      const target = room.targetRuns!;
      if (batter.score >= target) {
        // Chase successful! Batter wins the game
        gameOver = true;
        winnerId = batter.id;
        room.winnerId = winnerId;
        room.draw = false;
        this.transitionTo(room, 'RESULT');
      } else if (isOut) {
        // Batter is out. Check outcome.
        gameOver = true;
        inningsOver = true;
        if (batter.score === target - 1) {
          // Tie
          winnerId = null;
          room.winnerId = null;
          room.draw = true;
        } else {
          // Bowler wins the game (defended the score successfully)
          winnerId = bowler.id;
          room.winnerId = winnerId;
          room.draw = false;
        }
        this.transitionTo(room, 'RESULT');
      }
    }

    room.lastActive = Date.now();

    return {
      batterChoice: batChoice,
      bowlerChoice: bowlChoice,
      runsAdded,
      isOut,
      inningsOver,
      gameOver,
      winnerId,
    };
  }

  /**
   * Progresses the game from CHANGE_INNINGS to SECOND_INNINGS
   */
  public static startSecondInnings(room: GameRoom) {
    if (room.status !== 'CHANGE_INNINGS') {
      throw new Error('Can only start second innings from CHANGE_INNINGS state');
    }
    
    // Reset individual scores for this innings but keep target
    const currentBatter = room.players.find((p) => p.id === room.batterId)!;
    currentBatter.score = 0;
    currentBatter.wickets = 0;

    this.transitionTo(room, 'SECOND_INNINGS');
  }

  /**
   * Registers a play again response
   */
  public static handlePlayAgain(room: GameRoom, playerId: string, accept: boolean): { resetToToss: boolean; resetToLobby: boolean } {
    if (room.status !== 'RESULT' && room.status !== 'REMATCH') {
      throw new Error('Rematch choices can only be registered after a match ends');
    }

    if (room.status === 'RESULT') {
      this.transitionTo(room, 'REMATCH');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not in this room');
    }

    player.playAgain = accept;
    room.lastActive = Date.now();

    // If anyone declines, kick everyone back to the LOBBY state
    if (accept === false) {
      room.players.forEach((p) => {
        p.isReady = p.isHost;
        p.score = 0;
        p.wickets = 0;
        p.currentChoice = null;
        p.playAgain = null;
      });
      room.status = 'LOBBY';
      room.tossWinnerId = null;
      room.tossChoice = null;
      room.tossPrediction = null;
      room.coinFlipResult = null;
      room.batterId = null;
      room.bowlerId = null;
      room.targetRuns = null;
      room.moves = [];
      room.lastTurnResult = null;
      
      return { resetToToss: false, resetToLobby: true };
    }

    // Check if both accepted
    const bothAccepted = room.players.every((p) => p.playAgain === true);
    if (bothAccepted) {
      // Start complete new match in same room
      room.players.forEach((p) => {
        p.isReady = true; // Auto ready for new game
        p.score = 0;
        p.wickets = 0;
        p.currentChoice = null;
        p.playAgain = null;
      });
      room.tossWinnerId = null;
      room.tossChoice = null;
      room.tossPrediction = null;
      room.coinFlipResult = null;
      room.batterId = null;
      room.bowlerId = null;
      room.targetRuns = null;
      room.moves = [];
      room.lastTurnResult = null;
      room.revealTime = null;

      room.status = 'TOSS';
      return { resetToToss: true, resetToLobby: false };
    }

    return { resetToToss: false, resetToLobby: false };
  }
}
