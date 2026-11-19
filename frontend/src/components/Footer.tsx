import React from 'react';
import { ShieldCheck, Clock, Zap, Database, RefreshCw, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-slate-950/80 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-lg mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>SeatRush Engine</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Engineered to conquer high-concurrency ticket panics, flash-sale rushes, and inventory contention.
              Guarantees zero double bookings and zero limbo holds.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Concurrency Controls
            </h4>
            <ul className="text-xs space-y-2">
              <li className="flex items-center space-x-2 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>PostgreSQL Row-level Locks</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>PostgreSQL Holds + BullMQ Cleanup</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Database-backed Demo Idempotency</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Real-Time Fabric
            </h4>
            <ul className="text-xs space-y-2">
              <li className="flex items-center space-x-2 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Socket.IO Live Seat Sync</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Finite State Machine Transitions</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Event-driven Hold Expiry Queues</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              System Architecture
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Every component has a specific technical justification: PostgreSQL transactions,
              row-level locking for atomic seat allocation, and decoupled background worker queues.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">React + TS</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Node.js API</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">PostgreSQL Ready</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Redis & BullMQ</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 SeatRush Systems. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono">Built for extreme simultaneous demand.</p>
        </div>
      </div>
    </footer>
  );
};
