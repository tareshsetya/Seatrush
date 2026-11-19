import React, { useState } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Zap,
  Clock,
  CreditCard,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Terminal,
  Server,
  Database,
  ArrowRight,
} from 'lucide-react';

export const ProofLabPage: React.FC = () => {
  // Test 1: Contention Blitz
  const [targetSeat, setTargetSeat] = useState('event-coldplay-2026-B7');
  const [blitzUsers, setBlitzUsers] = useState(25);
  const [isBlitzing, setIsBlitzing] = useState(false);
  const [blitzResult, setBlitzResult] = useState<any>(null);

  // Test 2: BullMQ Expiry
  const [isExpiring, setIsExpiring] = useState(false);
  const [expiryResult, setExpiryResult] = useState<string | null>(null);

  // Test 3: Idempotent Webhook
  const [isWebhookTesting, setIsWebhookTesting] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);

  // Test 4: Benchmark
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  // Execute Test 1: Double Booking Contention Blitz
  const handleRunBlitz = async () => {
    setIsBlitzing(true);
    setBlitzResult(null);
    try {
      const res = await api.simulateContention('event-coldplay-2026', [targetSeat], blitzUsers);
      setBlitzResult(res);
    } catch (err: any) {
      alert('Contention test error: ' + err.message);
    } finally {
      setIsBlitzing(false);
    }
  };

  // Execute Test 2: Fast-forward BullMQ Hold Expiry
  const handleFastForwardExpiry = async () => {
    setIsExpiring(true);
    setExpiryResult(null);
    try {
      const res = await api.fastForwardExpiry();
      setExpiryResult(
        `Expiry sweep released ${res.released} expired hold(s). PostgreSQL owns the deadlines.`
      );
    } catch (err: any) {
      setExpiryResult('Error: ' + err.message);
    } finally {
      setIsExpiring(false);
    }
  };

  // Unsigned Stripe events must never be able to create bookings.
  const handleTestDuplicateWebhook = async () => {
    setWebhookResult({ note: 'Unsigned / fabricated Stripe webhooks are intentionally rejected. Signed Stripe test events require a configured Stripe account and proper PaymentIntent integration.' });
  };

  // Execute Test 4: Run Flash Sale Benchmark
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkResult(null);
    try {
      const report = await api.runBenchmark(
        ['event-coldplay-2026-B1', 'event-coldplay-2026-B2', 'event-coldplay-2026-B3'],
        60
      );
      setBenchmarkResult(report);
    } catch (err: any) {
      alert('Benchmark error: ' + err.message);
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Live Proof & Concurrency Verification Lab</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Proof Through Testing
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
          Local development diagnostics. These are in-process exercises, not external k6 load tests or proof of production scalability. Real payment integration is pending.
        </p>
      </div>

      {/* 4 Interactive Test Stations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ================= STATION 1: DOUBLE BOOKING CONTENTION ================= */}
        <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-purple-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-900/60 text-purple-300 border border-purple-500/40">
                PROVE SAFEGUARD #1
              </span>
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>

            <h3 className="text-xl font-black text-white">Double Booking: 50-User Row Lock Blitz</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Starts up to 50 concurrent hold operations inside the Node backend
              for a single seat. Proves PostgreSQL row-level locks (<code className="text-purple-300">SELECT ... FOR UPDATE</code>)
              allow one holder when the seat was initially available.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Target Seat</label>
                <input
                  type="text"
                  value={targetSeat}
                  onChange={(e) => setTargetSeat(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Concurrent Attackers</label>
                <select
                  value={blitzUsers}
                  onChange={(e) => setBlitzUsers(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={10}>10 Concurrent Users</option>
                  <option value={25}>25 Concurrent Users</option>
                  <option value={50}>50 Concurrent Users</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleRunBlitz}
              disabled={isBlitzing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isBlitzing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute {blitzUsers}-User Contention Blitz</span>
                </>
              )}
            </button>

            {blitzResult && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-xs font-mono space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Exactly one winner: {String(blitzResult.summary.invariantPreserved)}</span>
                </div>
                <div className="text-slate-300">
                  Total Attempts: <span className="font-bold">{blitzResult.summary.totalAttempts}</span> •
                  Winner: <span className="text-emerald-400 font-bold">{blitzResult.summary.successfulHolds}</span> •
                  Conflicts Blocked: <span className="text-amber-400 font-bold">{blitzResult.summary.conflictsPrevented}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  This tests concurrent holds, not payment charges. Existing holds can cause the test to be rejected.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= STATION 2: LIMBO SEAT AUTO-RECOVERY ================= */}
        <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-amber-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-900/60 text-amber-300 border border-amber-500/40">
                PROVE SAFEGUARD #2
              </span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>

            <h3 className="text-xl font-black text-white">Seats in Limbo: Database Expiry</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              When a buyer leaves, PostgreSQL stores the expiry deadline. BullMQ jobs and a periodic
              database sweep can return expired holds to
              <span className="text-emerald-400 font-bold"> AVAILABLE</span>, and push the change to all
              screens via WebSocket.
            </p>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 my-4 space-y-1">
              <div className="font-mono text-[11px] text-amber-300 font-bold">Queue Architecture:</div>
              <div>1. PostgreSQL records the hold and deadline; BullMQ schedules optional cleanup.</div>
              <div>2. Deadline passes; a worker or PostgreSQL sweeper safely releases the hold.</div>
              <div>3. Socket.IO broadcasts `SEATS_UPDATED` with reason `EXPIRED`.</div>
            </div>
          </div>

          <div>
            <button
              onClick={handleFastForwardExpiry}
              disabled={isExpiring}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50"
            >
              {isExpiring ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Check expired holds (PostgreSQL)</span>
                </>
              )}
            </button>

            {expiryResult && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                {expiryResult}
              </div>
            )}
          </div>
        </div>

        {/* ================= STATION 3: STRIPE IDEMPOTENT WEBHOOKS ================= */}
        <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-500/40">
                PROVE SAFEGUARD #3
              </span>
              <CreditCard className="w-5 h-5 text-cyan-400" />
            </div>

            <h3 className="text-xl font-black text-white">Stripe webhook safety (pending integration)</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              An unsigned webhook must not trigger booking. The actual Stripe payment and webhook
              idempotency implementation has not been integrated yet.
            </p>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 my-4 space-y-1">
              <div className="font-mono text-[11px] text-cyan-300 font-bold">Failure Test Case:</div>
              <div>Fake Stripe webhooks are disabled; real Stripe signature verification is required.</div>
            </div>
          </div>

          <div>
            <button
              onClick={handleTestDuplicateWebhook}
              disabled={isWebhookTesting}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
            >
              {isWebhookTesting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Show signed-webhook requirement</span>
                </>
              )}
            </button>

            {webhookResult && <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-cyan-300 text-xs">{webhookResult.note}</div>}
          </div>
        </div>

        {/* ================= STATION 4: K6 BENCHMARK SUITE ================= */}
        <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                LOCAL BENCHMARK
              </span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>

            <h3 className="text-xl font-black text-white">In-process contention benchmark</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Runs 60 asynchronous server-side hold attempts competing
              for 3 hot seats. Measures throughput (req/s), latency percentiles (P50, P95, P99),
              and verifies 0% double-booking error rate.
            </p>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 my-4 space-y-1">
              <div className="font-mono text-[11px] text-emerald-300 font-bold">Illustrative exercise (not a production SLA):</div>
              <div>• Concurrency: 60 Virtual Users • Target Seats: B1, B2, B3</div>
              <div>• P95 is observed, not guaranteed • Database uniqueness must hold</div>
            </div>
          </div>

          <div>
            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isBenchmarking ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execute 60-VU Flash Sale Benchmark</span>
                </>
              )}
            </button>

            {benchmarkResult && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">Throughput: {benchmarkResult.requestsPerSecond} req/s</span>
                  <span className="text-slate-400">Duration: {benchmarkResult.durationMs}ms</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800 text-[11px]">
                  <div className="p-1 rounded bg-slate-950">P50: {benchmarkResult.latencies.p50}ms</div>
                  <div className="p-1 rounded bg-slate-950">P95: {benchmarkResult.latencies.p95}ms</div>
                  <div className="p-1 rounded bg-slate-950">P99: {benchmarkResult.latencies.p99}ms</div>
                </div>
                <div className="text-emerald-400 text-center font-bold text-[11px]">
                  Invariant verified: {String(benchmarkResult.invariantVerified)} — unexpected wins: {benchmarkResult.doubleBookingsCount}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
