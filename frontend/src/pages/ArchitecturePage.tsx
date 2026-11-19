import React from 'react';
import { ShieldCheck, Clock, Zap, Database, ArrowRight, Lock, Flame, RefreshCw } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-12">
      {/* Header */}
      <div className="max-w-3xl">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
          Engineering Specifications
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
          Why SeatRush is Backend-Heavy
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-3">
          Most engineering effort in SeatRush goes into concurrency control, transactions,
          background jobs, real-time communication, and failure handling — not just screens.
          Here is what the current PostgreSQL-backed demo handles, and what still needs implementation.
        </p>
      </div>

      {/* The 5 Problems and Solutions Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problem 1 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-950 text-red-400 border border-red-500/30">
                Problem 01
              </span>
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Double Booking</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Two people get the exact same seat because the system checked availability and saved
              the booking in separate disconnected steps.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30">
            <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block mb-1">
              SeatRush Solution
            </span>
            <p className="text-xs text-slate-200 font-semibold">
              PostgreSQL row-level locks (<code className="text-purple-300">SELECT ... FOR UPDATE</code>)
              plus a <code className="text-purple-300">UNIQUE (event_id, label)</code> constraint as a database safety net.
            </p>
          </div>
        </div>

        {/* Problem 2 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-950 text-red-400 border border-red-500/30">
                Problem 02
              </span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Seats Stuck in Limbo</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Someone selects a seat, then closes their browser tab or walks away. Without a timed
              hold, the seat stays permanently blocked or gets sold twice.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30">
            <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block mb-1">
              SeatRush Solution
            </span>
            <p className="text-xs text-slate-200 font-semibold">
              PostgreSQL is authoritative for the hold expiry deadline. BullMQ can run delayed cleanup via Redis; a database sweep is the fallback, and expired holds are rejected even if cleanup is late.
            </p>
          </div>
        </div>

        {/* Problem 3 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-950 text-red-400 border border-red-500/30">
                Problem 03
              </span>
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Double Charging</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              A user clicks “Pay” twice, or an unstable network retry happens, and they are charged
              twice or receive duplicate tickets.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
            <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold block mb-1">
              SeatRush Solution
            </span>
            <p className="text-xs text-slate-200 font-semibold">
              A persisted idempotency key and request fingerprint prevent duplicate demo bookings. Real payment processing, Stripe webhook fulfillment and refunds are not implemented yet.
            </p>
          </div>
        </div>

        {/* Problem 4 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-yellow-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-950 text-red-400 border border-red-500/30">
                Problem 04
              </span>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Stale Screens</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              A user picks a seat that someone else took 30 seconds ago, because their seat map
              never updated after page load.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-yellow-950/40 border border-yellow-500/30">
            <span className="text-[10px] font-mono uppercase text-yellow-300 font-bold block mb-1">
              SeatRush Solution
            </span>
            <p className="text-xs text-slate-200 font-semibold">
              Socket.IO sends seat changes to event rooms on a single backend process. A Redis Pub/Sub adapter is required before scaling Socket.IO to multiple API instances.
            </p>
          </div>
        </div>
      </div>

      {/* State Machine Section */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800">
        <div className="max-w-2xl mb-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
            Invariant State Machine
          </span>
          <h2 className="text-2xl font-black text-white mt-1">Strict Seat Transitions</h2>
          <p className="text-xs text-slate-300 mt-1">
            Every seat moves strictly through AVAILABLE, HELD, and BOOKED. All invalid transitions are rejected.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 py-6">
          {/* AVAILABLE */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 text-center w-48 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-emerald-400 mx-auto mb-2" />
            <span className="font-mono font-black text-emerald-400 text-sm block">AVAILABLE</span>
            <span className="text-[10px] text-slate-400">Visible to all users</span>
          </div>

          <div className="flex flex-col items-center text-xs font-mono text-purple-400">
            <span className="text-[10px] text-slate-400">User clicks seat</span>
            <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
          </div>

          {/* HELD */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/40 text-center w-48 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-amber-400 mx-auto mb-2 animate-pulse" />
            <span className="font-mono font-black text-amber-400 text-sm block">HELD</span>
            <span className="text-[10px] text-slate-400">10-Minute Hold Window</span>
          </div>

          <div className="flex flex-col items-center text-xs font-mono text-purple-400">
            <span className="text-[10px] text-slate-400">Demo Checkout Confirmed</span>
            <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
          </div>

          {/* BOOKED */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-700 text-center w-48 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-slate-500 mx-auto mb-2" />
            <span className="font-mono font-black text-slate-300 text-sm block">BOOKED</span>
            <span className="text-[10px] text-slate-400">Locked permanently</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 text-center">
          ⚡ If 10-minute hold expires before checkout completes, seat transitions automatically back to <span className="text-emerald-400 font-bold">AVAILABLE</span> through deadline checks plus background cleanup!
        </div>
      </div>
    </div>
  );
};
