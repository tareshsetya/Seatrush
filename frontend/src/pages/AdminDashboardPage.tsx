import React, { useState, useEffect } from 'react';
import { ConcurrencyMetrics } from '../types';
import { api } from '../services/api';
import {
  Cpu,
  ShieldCheck,
  Clock,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Database,
  Flame,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ConcurrencyMetrics>({
    activeLocks: 0,
    activeHolds: 0,
    totalBookings: 0,
    lockCollisionsPrevented: 0,
    idempotencyHits: 0,
    expiredHoldsReleased: 0,
  });
  const [loading, setLoading] = useState(true);
  const [simUsers, setSimUsers] = useState(10);
  const [targetSeat, setTargetSeat] = useState('event-coldplay-2026-B7');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<any>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const data = await api.getAdminMetrics();
      if (data) setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimResults(null);
    try {
      const res = await api.simulateContention('event-coldplay-2026', [targetSeat], simUsers);
      setSimResults(res);
      await fetchMetrics();
    } catch (err: any) {
      alert('Simulation error: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all demo seats and bookings?')) return;
    try {
      await api.resetDatabase();
      setResetMessage('Local demo reset completed.');
      setTimeout(() => setResetMessage(null), 3000);
      await fetchMetrics();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-10">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Telemetry & Concurrency Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-white">System Diagnostics & Stress Testing</h1>
          <p className="text-xs text-slate-400 mt-1">
            PostgreSQL-backed demo metrics. Local proof tests are available only in development.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMetrics}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Refresh Telemetry
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Row Locks */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Row Locks</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-purple-300">{metrics.activeLocks}</div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Not instrumented</span>
        </div>

        {/* Active Holds */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active Holds</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-300">{metrics.activeHolds}</div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">10-min TTL queue</span>
        </div>

        {/* Collisions Prevented */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Races Caught</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-300">
            {metrics.lockCollisionsPrevented}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Only measured by proof test</span>
        </div>

        {/* Idempotent Hits */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Idempotent Replays</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-cyan-300">{metrics.idempotencyHits}</div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Not instrumented</span>
        </div>

        {/* Expired Holds */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Expired Holds</span>
            <Clock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black font-mono text-red-300">
            {metrics.expiredHoldsReleased}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Not instrumented</span>
        </div>

        {/* Total Bookings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Bookings</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-indigo-300">
            {metrics.totalBookings}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">Confirmed tickets</span>
        </div>
      </div>

      {/* Stress Test Simulator Console */}
      <div className="glass-panel-glow p-8 rounded-3xl border border-purple-500/30">
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold mb-2">
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Simultaneous Contention Experiment</span>
          </div>
          <h2 className="text-2xl font-black text-white">Simulate a Flash Sale Ticket Rush</h2>
          <p className="text-xs text-slate-300 leading-relaxed mt-1">
            This local demonstration starts several competing PostgreSQL hold transactions for one currently available seat. The expected result is exactly one successful holder; it does not establish performance at thousands of users.
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Simultaneous Competitors
            </label>
            <select
              value={simUsers}
              onChange={(e) => setSimUsers(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value={5}>5 Concurrent Users</option>
              <option value={10}>10 Concurrent Users</option>
              <option value={20}>20 Concurrent Users</option>
              <option value={50}>50 Concurrent Users</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Contested Seat</label>
            <input
              type="text"
              value={targetSeat}
              onChange={(e) => setTargetSeat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isSimulating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Launch Simultaneous Rush</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Stream */}
        {simResults && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Invariant Verified: {String(simResults.summary.invariantPreserved)}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Total Attempts: {simResults.summary.totalAttempts} • Successful Winner:{' '}
                    <span className="text-emerald-400 font-bold">
                      {simResults.summary.successfulHolds}
                    </span>{' '}
                    • Conflicts Blocked:{' '}
                    <span className="text-amber-400 font-bold">
                      {simResults.summary.conflictsPrevented}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Transaction Log Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">User / Thread</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Engine Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {simResults.results.map((res: any, idx: number) => (
                    <tr key={idx} className={res.status === 'SUCCESS' ? 'bg-emerald-950/20' : ''}>
                      <td className="p-3 font-bold">{res.user}</td>
                      <td className="p-3">
                        {res.status === 'SUCCESS' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/30">
                            ACQUIRED HOLD
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-bold border border-amber-500/30">
                            CONFLICT REJECTED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-xs">{res.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
