import { Server, Socket } from 'socket.io';
import { RoomManager } from './roomManager';
import { GameStateMachine } from './stateMachine';
import { AckResponse, GameRoom } from './types';

export class SocketHandler {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
  }

  /**
   * Broadcasts room updates to all players in that room
   */
  private broadcastRoomUpdate(roomCode: string, room: GameRoom) {
    this.io.to(roomCode).emit('room-update', room);
  }

  /**
   * Initializes event listeners on connection
   */
  public handleConnection(socket: Socket) {
    // 1. Time Synchronization Event
    socket.on('ping-sync', (data: { clientTime: number }) => {
      socket.emit('pong-sync', {
        clientTime: data.clientTime,
        serverTime: Date.now(),
      });
    });

    // 2. Create Room
    socket.on(
      'create-room',
      (data: { playerId: string; nickname: string }, callback: (res: AckResponse<{ room: GameRoom }>) => void) => {
        try {
          if (!data.playerId || !data.nickname) {
            return callback({ success: false, error: 'Player ID and nickname are required' });
          }
          const room = this.roomManager.createRoom(data.playerId, data.nickname, socket.id);
          socket.join(room.code);
          callback({ success: true, data: { room } });
        } catch (err: any) {
          callback({ success: false, error: err.message || 'Failed to create room' });
        }
      }
    );

    // 3. Join Room
    socket.on(
      'join-room',
      (data: { roomCode: string; playerId: string; nickname: string }, callback: (res: AckResponse<{ room: GameRoom }>) => void) => {
        try {
          if (!data.roomCode || !data.playerId || !data.nickname) {
            return callback({ success: false, error: 'Room code, player ID, and nickname are required' });
          }
          const room = this.roomManager.joinRoom(data.roomCode, data.playerId, data.nickname, socket.id);
          socket.join(room.code);
          
          callback({ success: true, data: { room } });
          this.broadcastRoomUpdate(room.code, room);
        } catch (err: any) {
          callback({ success: false, error: err.message || 'Failed to join room' });
        }
      }
    );

    // 4. Reconnect Room
    socket.on(
      'reconnect-room',
      (data: { roomCode: string; playerId: string }, callback: (res: AckResponse<{ room: GameRoom }>) => void) => {
        try {
          if (!data.roomCode || !data.playerId) {
            return callback({ success: false, error: 'Room code and player ID are required' });
          }
          const room = this.roomManager.reconnectPlayer(data.roomCode, data.playerId, socket.id);
          socket.join(room.code);
          
          callback({ success: true, data: { room } });
          this.broadcastRoomUpdate(room.code, room);
        } catch (err: any) {
          callback({ success: false, error: err.message || 'Failed to reconnect' });
        }
      }
    );

    // 5. Player Ready status toggle
    socket.on(
      'ready',
      (data: { roomCode: string; playerId: string; ready: boolean }, callback: (res: AckResponse) => void) => {
        try {
          const room = this.roomManager.getRoom(data.roomCode);
          if (!room) return callback({ success: false, error: 'Room not found' });

          if (room.status !== 'LOBBY' && room.status !== 'READY') {
            return callback({ success: false, error: 'Ready status can only change in the lobby' });
          }

          const player = room.players.find((p) => p.id === data.playerId);
          if (!player) return callback({ success: false, error: 'Player not in this room' });

          player.isReady = data.ready;

          // Check if both are ready (must be 2 players)
          const allReady = room.players.length === 2 && room.players.every((p) => p.isReady);
          room.status = allReady ? 'READY' : 'LOBBY';

          callback({ success: true });
          this.broadcastRoomUpdate(room.code, room);
        } catch (err: any) {
          callback({ success: false, error: err.message });
        }
      }
    );

    // 6. Host starts game
    socket.on(
      'start-game',
      (data: { roomCode: string; playerId: string }, callback: (res: AckResponse) => void) => {
        try {
          const room = this.roomManager.getRoom(data.roomCode);
          if (!room) return callback({ success: false, error: 'Room not found' });

          const player = room.players.find((p) => p.id === data.playerId);
          if (!player || !player.isHost) {
            return callback({ success: false, error: 'Only the host can start the game' });
          }

          if (room.status !== 'READY') {
            return callback({ success: false, error: 'All players must be ready to start' });
          }

          GameStateMachine.transitionTo(room, 'TOSS');
          callback({ success: true });
          this.broadcastRoomUpdate(room.code, room);
        } catch (err: any) {
          callback({ success: false, error: err.message });
        }
      }
    );

    // 7. Guest submits coin prediction during TOSS
    socket.on(
      'toss-guess',
      (data: { roomCode: string; playerId: string; prediction: 'heads' | 'tails' }, callback: (res: AckResponse) => void) => {
        try {
          const room = this.roomManager.getRoom(data.roomCode);
          if (!room) return callback({ success: false, error: 'Room not found' });

          const player = room.players.find((p) => p.id === data.playerId);
          if (!player || player.isHost) {
            return callback({ success: false, error: 'Only the guest makes the toss prediction' });
          }

          const { winnerId, result } = GameStateMachine.handleCoinToss(room, data.prediction);
          
          callback({ success: true });
          this.broadcastRoomUpdate(room.code, room);
        } catch (err: any) {
          callback({ success: false, error: err.message });
        }
      }
    );

    // 8. Toss winner selects Bat/Bowl
    socket.on(
      'bat-bowl-choice',
      (data: { roomCode: string; playerId: string; choice: 'bat' | 'bowl' }, callback: (res: AckResponse) => void) => {
        try {
          const room = this.roomManager.getRoom(data.roomCode);
          if (!room) return callback({ success: false, error: 'Room not found' });

          GameStateMachine.handleTossDecision(room, data.playerId, data.choice);
          
          callback({ success: true });
          this.broadcastRoomUpdate(room.code, room);
        } catch (err: any) {
          callback({ success: false, error: err.message });
        }
      }
    );

    // 9. Submit Game Move (1-6)
    socket.on(
      'submit-move',
      (data: { roomCode: string; playerId: string; choice: number }, callback: (res: AckResponse) => void) => {
        try {
          const room = this.roomManager.getRoom(data.roomCode);
          if (!room) return callback({ success: false, error: 'Room not found' });

          const { resolved, revealTime } = GameStateMachine.submitChoice(room, data.playerId, data.choice);
          
          callback({ success: true });

          if (resolved) {
            // Emitting moves immediately with a future revealTime for synced triggers
            const choiceSnapshot = room.players.map((p) => ({
              id: p.id,
              choice: p.currentChoice,
            }));

            // Resolve the turn authoritatively on the server right now to produce updatedRoom
            // Client receives both the reveal moves event (choices) AND the final computed room state
            const turnSnapshot = GameStateMachine.resolveTurn(room);

            this.io.to(room.code).emit('reveal-moves', {
              revealTime,
              choices: choiceSnapshot,
              turnResult: turnSnapshot,
              updatedRoom: room,
            });
          } else {
            // Tell other player that opponent has made their move (blind status update)
            socket.to(room.code).emit('opponent-moved');
          }
        } catch (err: any) {
          callback({ success: false, error: err.message });
        }
      }
    );

    // 10. Start Second Innings (called by Host or automatically after a timer, let's allow explicit action)
    socket.on(
      'start-second-innings',
      (data: { roomCode: string; playerId: string }, callback?: (res: AckResponse) => void) => {
        try {
          const room = this.roomManager.getRoom(data.roomCode);
          if (!room) {
            if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
            return;
          }

          GameStateMachine.startSecondInnings(room);
          if (typeof callback === 'function') callback({ success: true });
          this.broadcastRoomUpdate(room.code, room);
        } catch (err: any) {
          if (typeof callback === 'function') callback({ success: false, error: err.message });
        }
      }
    );

    // 11. Play Again rematch responses
    socket.on(
      'play-again',
      (data: { roomCode: string; playerId: string; accept: boolean }, callback: (res: AckResponse) => void) => {
        try {
          const room = this.roomManager.getRoom(data.roomCode);
          if (!room) return callback({ success: false, error: 'Room not found' });

          const { resetToToss, resetToLobby } = GameStateMachine.handlePlayAgain(room, data.playerId, data.accept);
          
          callback({ success: true });
          this.broadcastRoomUpdate(room.code, room);
        } catch (err: any) {
          callback({ success: false, error: err.message });
        }
      }
    );

    // 12. Leave Room
    socket.on(
      'leave-room',
      (data: { roomCode: string; playerId: string }, callback: (res: AckResponse) => void) => {
        try {
          const room = this.roomManager.leaveRoom(data.roomCode, data.playerId);
          socket.leave(data.roomCode);
          callback({ success: true });
          
          if (room) {
            this.broadcastRoomUpdate(room.code, room);
          }
        } catch (err: any) {
          callback({ success: false, error: err.message });
        }
      }
    );

    // 13. Disconnect
    socket.on('disconnect', () => {
      this.roomManager.registerDisconnect(socket.id, (room, winner, disconnectedPlayer) => {
        // Send notification to the room that a player forfeited
        this.io.to(room.code).emit('player-forfeited', {
          winnerId: winner.id,
          disconnectedPlayerId: disconnectedPlayer.id,
          room,
        });
      });
    });
  }
}
