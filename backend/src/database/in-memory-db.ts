import { Event, Seat, Booking } from '../types/index.js';

export class InMemoryDatabase {
  private events: Map<string, Event> = new Map();
  private seats: Map<string, Seat> = new Map();
  private bookings: Map<string, Booking> = new Map();

  // --- Events ---
  public setEvent(event: Event): void {
    this.events.set(event.id, { ...event });
  }

  public getEvent(id: string): Event | undefined {
    const event = this.events.get(id);
    if (!event) return undefined;

    // Recalculate dynamic seat counts
    const eventSeats = this.getSeatsByEvent(id);
    const availableSeats = eventSeats.filter((s) => s.status === 'AVAILABLE').length;
    const heldSeats = eventSeats.filter((s) => s.status === 'HELD').length;
    const bookedSeats = eventSeats.filter((s) => s.status === 'BOOKED').length;

    return {
      ...event,
      totalSeats: eventSeats.length,
      availableSeats,
      heldSeats,
      bookedSeats,
    };
  }

  public getAllEvents(): Event[] {
    return Array.from(this.events.keys()).map((id) => this.getEvent(id)!);
  }

  // --- Seats ---
  public setSeat(seat: Seat): void {
    this.seats.set(seat.id, { ...seat });
  }

  public getSeatById(id: string): Seat | undefined {
    return this.seats.get(id);
  }

  public getSeatsByEvent(eventId: string): Seat[] {
    return Array.from(this.seats.values())
      .filter((s) => s.eventId === eventId)
      .sort((a, b) => {
        if (a.row === b.row) return a.col - b.col;
        return a.row.localeCompare(b.row);
      });
  }

  public getSeatsByIds(ids: string[]): Seat[] {
    return ids.map((id) => this.seats.get(id)).filter((s): s is Seat => !!s);
  }

  public updateSeat(seat: Seat): void {
    this.seats.set(seat.id, { ...seat });
  }

  // --- Bookings ---
  public createBooking(booking: Booking): void {
    this.bookings.set(booking.id, { ...booking });
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  public getBookingByReference(referenceNumber: string): Booking | undefined {
    return Array.from(this.bookings.values()).find(
      (b) => b.referenceNumber === referenceNumber
    );
  }

  public getBookingsByUserId(userId: string): Booking[] {
    return Array.from(this.bookings.values())
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getBookingByIdempotencyKey(key: string): Booking | undefined {
    return Array.from(this.bookings.values()).find((b) => b.idempotencyKey === key);
  }

  public getAllBookings(): Booking[] {
    return Array.from(this.bookings.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Clear for tests
  public reset(): void {
    this.events.clear();
    this.seats.clear();
    this.bookings.clear();
  }
}

export const db = new InMemoryDatabase();
