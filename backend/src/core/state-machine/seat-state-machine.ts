import { SeatState } from '../../types/index.js';
import { InvalidStateTransitionError } from '../errors/index.js';

export class SeatStateMachine {
  private static readonly allowedTransitions: Record<SeatState, SeatState[]> = {
    AVAILABLE: ['HELD'],
    HELD: ['BOOKED', 'AVAILABLE'],
    BOOKED: ['AVAILABLE'], // Only via explicit refund/admin override
  };

  public static canTransition(from: SeatState, to: SeatState): boolean {
    return this.allowedTransitions[from]?.includes(to) ?? false;
  }

  public static validateTransition(from: SeatState, to: SeatState): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionError(from, to);
    }
  }
}
