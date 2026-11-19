import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private joinedEvents = new Set<string>();

  public getSocket(): Socket {
    if (!this.socket) {
      // Connect to same host or backend proxy
      this.socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('⚡ Socket.IO connected with ID:', this.socket?.id);
        // Socket.IO rooms are lost on reconnect: rejoin every active event.
        for (const eventId of this.joinedEvents) this.socket?.emit('join_event', eventId);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Socket.IO disconnected');
      });
    }

    return this.socket;
  }

  public joinEvent(eventId: string): void {
    this.joinedEvents.add(eventId);
    const s = this.getSocket();
    s.emit('join_event', eventId);
  }

  public leaveEvent(eventId: string): void {
    this.joinedEvents.delete(eventId);
    const s = this.getSocket();
    s.emit('leave_event', eventId);
  }
}

export const socketClient = new SocketClient();
