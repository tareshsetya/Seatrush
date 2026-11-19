export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConcurrencyConflictError extends AppError {
  constructor(message = 'Seat has already been reserved or booked by another transaction') {
    super(message, 409, 'CONCURRENCY_CONFLICT');
  }
}

export class HoldExpiredError extends AppError {
  constructor(message = 'The hold period for this seat has expired') {
    super(message, 410, 'HOLD_EXPIRED');
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(fromState: string, toState: string) {
    super(`Cannot transition seat from ${fromState} to ${toState}`, 400, 'INVALID_STATE_TRANSITION');
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(message = 'A request with this Idempotency-Key is currently being processed') {
    super(message, 409, 'IDEMPOTENCY_CONFLICT');
  }
}
