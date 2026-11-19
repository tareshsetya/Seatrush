import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Seat, SocketSeatUpdatePayload } from '../../types/index.js';

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public init(httpServer: HttpServer, frontendUrl: string): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [...frontendUrl.split(',').map(s => s.trim()), 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      // User joins specific event room to receive live seat updates
      socket.on('join_event', (eventId: string) => {
        socket.join(`event:${eventId}`);
      });

      socket.on('leave_event', (eventId: string) => {
        socket.leave(`event:${eventId}`);
      });

      socket.on('disconnect', () => {
        // cleanup if needed
      });
    });

    return this.io;
  }

  public broadcastSeatUpdate(
    eventId: string,
    updatedSeats: Seat[],
    reason: 'HELD' | 'RELEASED' | 'BOOKED' | 'EXPIRED'
  ): void {
    if (!this.io) return;

    const payload: SocketSeatUpdatePayload = {
      eventId,
      updatedSeats,
      reason,
    };

    // Emit to specific event room and to all clients
    this.io.to(`event:${eventId}`).emit('SEATS_UPDATED', payload);
    // Event-specific rooms only; do not broadcast unrelated seat data globally.
  }

  public broadcastMetrics(metrics: any): void {
    if (!this.io) return;
    this.io.emit('METRICS_UPDATED', metrics);
  }
}
