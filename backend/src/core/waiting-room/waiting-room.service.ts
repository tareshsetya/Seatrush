export interface QueueEntry {
  userId: string;
  eventId: string;
  joinedAt: number;
  position: number;
  admitted: boolean;
  token?: string;
}

export class WaitingRoomService {
  private queue: QueueEntry[] = [];
  private activeUsers = new Set<string>();
  private readonly MAX_ACTIVE_SLOTS = 20; // 20 concurrent shoppers per event in flash sale mode

  public join(userId: string, eventId: string): QueueEntry {
    // If already active, return admitted entry
    if (this.activeUsers.has(userId)) {
      return {
        userId,
        eventId,
        joinedAt: Date.now(),
        position: 0,
        admitted: true,
        token: `wt_admitted_${userId}`,
      };
    }

    // Check existing position
    const existingIdx = this.queue.findIndex((q) => q.userId === userId);
    if (existingIdx !== -1) {
      return this.queue[existingIdx];
    }

    // If slots are available, admit immediately
    if (this.activeUsers.size < this.MAX_ACTIVE_SLOTS) {
      this.activeUsers.add(userId);
      return {
        userId,
        eventId,
        joinedAt: Date.now(),
        position: 0,
        admitted: true,
        token: `wt_admitted_${userId}`,
      };
    }

    // Otherwise place in queue
    const entry: QueueEntry = {
      userId,
      eventId,
      joinedAt: Date.now(),
      position: this.queue.length + 1,
      admitted: false,
    };

    this.queue.push(entry);
    return entry;
  }

  public checkStatus(userId: string): { admitted: boolean; position: number; estimatedWaitSeconds: number; token?: string } {
    if (this.activeUsers.has(userId)) {
      return { admitted: true, position: 0, estimatedWaitSeconds: 0, token: `wt_admitted_${userId}` };
    }

    const idx = this.queue.findIndex((q) => q.userId === userId);
    if (idx === -1) {
      // not in queue
      return { admitted: false, position: -1, estimatedWaitSeconds: 0 };
    }

    const position = idx + 1;
    const estimatedWaitSeconds = position * 3; // roughly 3 seconds per slot turnover
    return { admitted: false, position, estimatedWaitSeconds };
  }

  public leave(userId: string): void {
    this.activeUsers.delete(userId);
    this.queue = this.queue.filter((q) => q.userId !== userId);

    // Promote next in queue
    if (this.queue.length > 0 && this.activeUsers.size < this.MAX_ACTIVE_SLOTS) {
      const next = this.queue.shift();
      if (next) {
        this.activeUsers.add(next.userId);
      }
    }
  }

  public getStats() {
    return {
      activeShoppers: this.activeUsers.size,
      maxSlots: this.MAX_ACTIVE_SLOTS,
      waitingInLine: this.queue.length,
    };
  }
}

export const waitingRoomService = new WaitingRoomService();
