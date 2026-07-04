export type GameState =
  | 'WAITING'
  | 'LOBBY'
  | 'READY'
  | 'TOSS'
  | 'BAT_OR_BOWL'
  | 'FIRST_INNINGS'
  | 'CHANGE_INNINGS'
  | 'SECOND_INNINGS'
  | 'RESULT'
  | 'REMATCH';

export interface Player {
  id: string; // cryptographically secure UUID
  nickname: string;
  socketId: string | null;
  isHost: boolean;
  isReady: boolean;
  score: number;
  wickets: number; // standard hand cricket is 1 wicket (out = innings end)
  currentChoice: number | null; // currently submitted choice for the turn (1-6)
  playAgain: boolean | null; // rematch choice (true = accept, false = decline, null = waiting)
  connected: boolean;
  disconnectedAt: number | null; // epoch time when disconnected for grace period
}

export interface MoveRecord {
  turnNumber: number;
  batterChoice: number;
  bowlerChoice: number;
  runsAdded: number;
  isOut: boolean;
  batterId: string;
}

export interface MatchMetadata {
  matchId: string;
  roomCode: string;
  startTime: number;
  endTime: number;
  duration: number;
  winnerId: string | null;
  draw: boolean;
  hostName: string;
  guestName: string;
  hostScore: number;
  guestScore: number;
}

export interface GameRoom {
  code: string;
  status: GameState;
  players: Player[];
  tossWinnerId: string | null;
  tossChoice: 'bat' | 'bowl' | null;
  tossPrediction: 'heads' | 'tails' | null; // guest choice
  coinFlipResult: 'heads' | 'tails' | null;
  batterId: string | null;
  bowlerId: string | null;
  targetRuns: number | null; // Inns 1 Score + 1
  moves: MoveRecord[];
  lastActive: number; // for room cleanup garbage collection
  revealTime: number | null; // synchronized timestamp (ms) for client hand animation start
  winnerId: string | null;
  draw: boolean;
  lastTurnResult: {
    batterChoice: number;
    bowlerChoice: number;
    runsAdded: number;
    isOut: boolean;
    batterId: string;
  } | null;
}

export interface AckResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}
