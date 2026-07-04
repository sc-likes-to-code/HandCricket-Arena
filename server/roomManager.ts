import crypto from 'crypto';
import { GameRoom, Player } from './types';

// Exclude: 0, O, I, 1, L
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const RECONNECT_GRACE_PERIOD_MS = 45000; // 45 seconds grace period
const ROOM_MAX_INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map(); // key: roomCode + "_" + playerId

  /**
   * Generates a cryptographically secure 6-letter room code
   */
  private generateRoomCode(): string {
    let attempts = 0;
    while (attempts < 1000) {
      let code = '';
      const bytes = crypto.randomBytes(CODE_LENGTH);
      for (let i = 0; i < CODE_LENGTH; i++) {
        const index = bytes[i] % ALPHABET.length;
        code += ALPHABET[index];
      }
      if (!this.rooms.has(code)) {
        return code;
      }
      attempts++;
    }
    throw new Error('Failed to generate unique room code');
  }

  /**
   * Creates a new game room with the host
   */
  public createRoom(playerId: string, nickname: string, socketId: string): GameRoom {
    const code = this.generateRoomCode();
    const host: Player = {
      id: playerId,
      nickname: nickname.trim(),
      socketId,
      isHost: true,
      isReady: true,
      score: 0,
      wickets: 0,
      currentChoice: null,
      playAgain: null,
      connected: true,
      disconnectedAt: null,
    };

    const newRoom: GameRoom = {
      code,
      status: 'WAITING',
      players: [host],
      tossWinnerId: null,
      tossChoice: null,
      tossPrediction: null,
      coinFlipResult: null,
      batterId: null,
      bowlerId: null,
      targetRuns: null,
      moves: [],
      lastActive: Date.now(),
      revealTime: null,
      winnerId: null,
      draw: false,
      lastTurnResult: null,
    };

    this.rooms.set(code, newRoom);
    return newRoom;
  }

  /**
   * Retrieves a room by its code
   */
  public getRoom(code: string): GameRoom | undefined {
    const room = this.rooms.get(code.toUpperCase().trim());
    if (room) {
      room.lastActive = Date.now();
    }
    return room;
  }

  /**
   * Joins an existing room
   */
  public joinRoom(code: string, playerId: string, nickname: string, socketId: string): GameRoom {
    const upperCode = code.toUpperCase().trim();
    const room = this.rooms.get(upperCode);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'WAITING') {
      throw new Error('Game already started or room is full');
    }

    if (room.players.length >= 2) {
      throw new Error('Room is full');
    }

    // Check if player is somehow already in the room
    const existingPlayer = room.players.find((p) => p.id === playerId);
    if (existingPlayer) {
      // Re-association
      existingPlayer.socketId = socketId;
      existingPlayer.connected = true;
      existingPlayer.disconnectedAt = null;
      room.lastActive = Date.now();
      return room;
    }

    const guest: Player = {
      id: playerId,
      nickname: nickname.trim(),
      socketId,
      isHost: false,
      isReady: false,
      score: 0,
      wickets: 0,
      currentChoice: null,
      playAgain: null,
      connected: true,
      disconnectedAt: null,
    };

    room.players.push(guest);
    room.status = 'LOBBY';
    room.lastActive = Date.now();

    return room;
  }

  /**
   * Leaves a room explicitly
   */
  public leaveRoom(code: string, playerId: string): GameRoom | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    // Clear any active disconnect timer for this player
    const timerKey = `${code}_${playerId}`;
    const timer = this.disconnectTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(timerKey);
    }

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return room;

    const removedPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return null;
    }

    // If host left, assign host role to the remaining player
    if (removedPlayer.isHost) {
      room.players[0].isHost = true;
    }

    room.status = 'LOBBY';
    room.tossWinnerId = null;
    room.tossChoice = null;
    room.tossPrediction = null;
    room.coinFlipResult = null;
    room.batterId = null;
    room.bowlerId = null;
    room.targetRuns = null;
    room.moves = [];
    room.revealTime = null;
    room.winnerId = null;
    room.draw = false;
    room.lastTurnResult = null;

    room.players.forEach((p) => {
      p.isReady = p.isHost;
      p.score = 0;
      p.wickets = 0;
      p.currentChoice = null;
      p.playAgain = null;
    });

    room.lastActive = Date.now();
    return room;
  }

  /**
   * Sets up a disconnection timer for grace periods.
   * If they don't reconnect in time, they forfeit the match.
   */
  public registerDisconnect(socketId: string, onForfeitCallback: (room: GameRoom, winner: Player, disconnectedPlayer: Player) => void) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.connected = false;
        player.disconnectedAt = Date.now();
        room.lastActive = Date.now();

        // If game is not active (lobby or waiting), clean up immediately if they leave
        if (room.status === 'WAITING' || room.status === 'LOBBY') {
          // Wait a short time to allow quick refreshes in lobby
          const timerKey = `${code}_${player.id}`;
          const timer = setTimeout(() => {
            this.leaveRoom(code, player.id);
          }, 5000);
          this.disconnectTimers.set(timerKey, timer);
          return;
        }

        // Active game: start the 45s grace period
        const timerKey = `${code}_${player.id}`;
        const timer = setTimeout(() => {
          this.disconnectTimers.delete(timerKey);
          const activeRoom = this.rooms.get(code);
          if (!activeRoom) return;

          const disconnectedPlayer = activeRoom.players.find((p) => p.id === player.id);
          const opponent = activeRoom.players.find((p) => p.id !== player.id);

          if (disconnectedPlayer && !disconnectedPlayer.connected && opponent) {
            // Forfeit! Opponent wins.
            activeRoom.status = 'RESULT';
            activeRoom.lastActive = Date.now();
            onForfeitCallback(activeRoom, opponent, disconnectedPlayer);
          }
        }, RECONNECT_GRACE_PERIOD_MS);

        this.disconnectTimers.set(timerKey, timer);
        return;
      }
    }
  }

  /**
   * Reconnects a player who disconnected temporarily
   */
  public reconnectPlayer(code: string, playerId: string, socketId: string): GameRoom {
    const upperCode = code.toUpperCase().trim();
    const room = this.rooms.get(upperCode);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not part of this room');
    }

    // Clear disconnect timer
    const timerKey = `${upperCode}_${playerId}`;
    const timer = this.disconnectTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(timerKey);
    }

    player.socketId = socketId;
    player.connected = true;
    player.disconnectedAt = null;
    room.lastActive = Date.now();

    return room;
  }

  /**
   * Clears timers and deletes a room entirely
   */
  public deleteRoom(code: string) {
    const room = this.rooms.get(code);
    if (room) {
      room.players.forEach((p) => {
        const timerKey = `${code}_${p.id}`;
        const timer = this.disconnectTimers.get(timerKey);
        if (timer) {
          clearTimeout(timer);
          this.disconnectTimers.delete(timerKey);
        }
      });
      this.rooms.delete(code);
    }
  }

  /**
   * Background garbage collection cleanup routine
   */
  public runCleanup() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      // 1. If room has no players
      if (room.players.length === 0) {
        this.deleteRoom(code);
        continue;
      }

      // 2. If room is inactive for a long time
      if (now - room.lastActive > ROOM_MAX_INACTIVITY_MS) {
        this.deleteRoom(code);
        continue;
      }

      // 3. If all players are disconnected for longer than grace period (safeguard)
      const allDisconnected = room.players.every((p) => !p.connected);
      if (allDisconnected) {
        const oldestDisconnect = Math.min(
          ...room.players.map((p) => p.disconnectedAt || now)
        );
        if (now - oldestDisconnect > RECONNECT_GRACE_PERIOD_MS) {
          this.deleteRoom(code);
        }
      }
    }
  }
}
