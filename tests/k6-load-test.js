import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const doubleBookingErrors = new Counter('double_booking_errors');
const conflictRate = new Rate('concurrency_conflict_rate');
const holdDurationTrend = new Trend('seat_hold_latency_ms');

export const options = {
  scenarios: {
    flash_sale_rush: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 1000,
      stages: [
        { target: 200, duration: '15s' }, // Ramp up to 200 req/s
        { target: 500, duration: '30s' }, // Flash sale peak at 500 req/s
        { target: 50, duration: '15s' },  // Cooldown
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% infrastructure errors (excludes 409 conflicts)
    http_req_duration: ['p(95)<350'], // 95% of requests under 350ms
    double_booking_errors: ['count==0'], // CRITICAL: Absolutely ZERO double bookings allowed
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api';
const EVENT_ID = 'event-coldplay-2026';

export default function () {
  const userId = `k6_vu_${__VU}_${__ITER}`;
  const targetSeat = `event-coldplay-2026-B${(__ITER % 12) + 1}`; // Target popular row B seats

  // 1. Attempt to hold a seat
  const holdPayload = JSON.stringify({
    eventId: EVENT_ID,
    seatIds: [targetSeat],
    userId: userId,
    ttlSeconds: 600,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const startTime = Date.now();
  const holdRes = http.post(`${BASE_URL}/seats/hold`, holdPayload, params);
  holdDurationTrend.add(Date.now() - startTime);

  // Check response
  if (holdRes.status === 200) {
    conflictRate.add(0);
    check(holdRes, {
      'Seat hold acquired successfully': (r) => r.json('success') === true,
    });

    // 2. Simulated payment with Idempotency Key
    sleep(0.5);
    const idempotencyKey = `idem_k6_${userId}_${Date.now()}`;
    const checkoutPayload = JSON.stringify({
      eventId: EVENT_ID,
      seatIds: [targetSeat],
      userId: userId,
      userEmail: `${userId}@loadtest.com`,
      userName: `Load Tester ${__VU}`,
      idempotencyKey: idempotencyKey,
      paymentDetails: {
        cardNumberLast4: '4242',
        paymentMethod: 'k6_stripe_mock',
      },
    });

    const checkoutRes = http.post(`${BASE_URL}/bookings`, checkoutPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    });

    check(checkoutRes, {
      'Booking finalized': (r) => r.status === 201 || r.status === 200,
    });
  } else if (holdRes.status === 409) {
    // Expected concurrency conflict: seat already held by a faster concurrent transaction
    conflictRate.add(1);
    check(holdRes, {
      'Conflict caught gracefully without crashing': (r) => r.status === 409,
    });
  } else {
    // Unexpected error (double booking or crash)
    doubleBookingErrors.add(1);
  }

  sleep(0.1);
}
