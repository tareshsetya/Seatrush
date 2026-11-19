-- SeatRush local/demo schema. Changes are additive; existing bookings are preserved.
DO $$ BEGIN
  CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'HELD', 'BOOKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE seat_tier AS ENUM ('VIP', 'PREMIUM', 'STANDARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'REFUNDED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    artist VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time VARCHAR(32) NOT NULL,
    banner_url TEXT NOT NULL,
    description TEXT NOT NULL,
    total_seats INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS seats (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    seat_row VARCHAR(8) NOT NULL,
    seat_col INTEGER NOT NULL,
    label VARCHAR(32) NOT NULL,
    tier seat_tier NOT NULL DEFAULT 'STANDARD',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    held_by VARCHAR(128),
    held_until TIMESTAMPTZ,
    booked_by VARCHAR(128),
    booked_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_event_seat_label UNIQUE (event_id, label),
    CONSTRAINT seat_state_integrity CHECK (
      (status = 'AVAILABLE' AND held_by IS NULL AND held_until IS NULL AND booked_by IS NULL)
      OR (status = 'HELD' AND held_by IS NOT NULL AND held_until IS NOT NULL AND booked_by IS NULL)
      OR (status = 'BOOKED' AND booked_by IS NOT NULL AND held_by IS NULL AND held_until IS NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_seats_event ON seats(event_id);
CREATE INDEX IF NOT EXISTS idx_seats_expiry ON seats(held_until) WHERE status = 'HELD';
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    reference_number VARCHAR(32) UNIQUE NOT NULL,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id),
    user_id VARCHAR(128) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    request_fingerprint VARCHAR(64),
    status booking_status NOT NULL DEFAULT 'CONFIRMED',
    qr_code_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS request_fingerprint VARCHAR(64);
CREATE TABLE IF NOT EXISTS booking_seats (
    booking_id VARCHAR(64) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id VARCHAR(64) NOT NULL REFERENCES seats(id),
    price_at_booking NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (booking_id, seat_id)
);
CREATE INDEX IF NOT EXISTS idx_booking_seats_seat ON booking_seats(seat_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, created_at DESC);
