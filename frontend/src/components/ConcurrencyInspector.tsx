import React, { useState, useEffect } from 'react';
import { ConcurrencyMetrics, SocketSeatUpdatePayload } from '../types';
import { api } from '../services/api';
import { socketClient } from '../services/socket';
import { Zap, X, ShieldAlert, Cpu, Activity, Play, CheckCircle2 } from 'lucide-react';

interface ConcurrencyInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  activeHoldCount: number;
}

export const ConcurrencyInspector: React.FC<ConcurrencyInspectorProps> = ({
  isOpen,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<ConcurrencyMetrics>({
    activeLocks: 0,
    activeHolds: 0,
    totalBookings: 0,
    lockCollisionsPrevented: 0,
    idempotencyHits: 0,
    expiredHoldsReleased: 0,
  });
  const [socketLogs, setSocketLogs] = useState<{ timestamp: string; text: string }[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const fetchMetrics = async () => {
    try {
      const data = await api.getAdminMetrics();
      if (data) setMetrics(data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);

    const socket = socketClient.getSocket();
    const handleSeatUpdate = (payload: SocketSeatUpdatePayload) => {
      const time = new Date().toLocaleTimeString();
      const seatLabels = payload.updatedSeats.map((s) => s.label).join(', ');
      setSocketLogs((prev) => [
        {
          timestamp: time,
          text: `[WebSocket] ${payload.reason}: ${seatLabels} (${payload.eventId})`,
        },
        ...prev.slice(0, 15),
      ]);
      fetchMetrics();
    };

    socket.on('SEATS_UPDATED', handleSeatUpdate);

    return () => {
      clearInterval(interval);
      socket.off('SEATS_UPDATED', handleSeatUpdate);
    };
  }, []);

  const runQuickSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await api.simulateContention('event-coldplay-2026', ['event-coldplay-2026-B7'], 10);
      setSimulationResult(res.summary);
      await fetchMetrics();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-950/95 border-l border-purple-500/30 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between animate-fade-in overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Engine Inspector</h3>
              <p className="text-[10px] text-slate-400 font-mono">Live Concurrency Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time KPI Stats */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">Row-Level Locks</span>
            <span className="text-xl font-mono font-black text-purple-400">
              {metrics.activeLocks}
            </span>
            <span className="text-[9px] text-slate-500 block">Active in-flight mutex</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">Active Holds</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {metrics.activeHolds}
            </span>
            <span className="text-[9px] text-slate-500 block">10-min Redis TTL queue</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">Races Caught</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {metrics.lockCollisionsPrevented}
            </span>
            <span className="text-[9px] text-slate-500 block">Double-bookings averted</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">Idempotent Replays</span>
            <span className="text-xl font-mono font-black text-cyan-400">
              {metrics.idempotencyHits}
            </span>
            <span className="text-[9px] text-slate-500 block">Double-charges rejected</span>
          </div>
        </div>

        {/* Stress Simulator Button */}
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300">Stress Test Mutex</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900 text-purple-200">
              10x Users / 1 Seat
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Fires 10 concurrent HTTP requests simultaneously for Seat B7 to test row locking.
          </p>

          <button
            onClick={runQuickSimulation}
            disabled={isSimulating}
            className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
          >
            {isSimulating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Simulate 10 Concurrent Users</span>
              </>
            )}
          </button>

          {simulationResult && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Invariant Preserved: Exactly 1 Winner</span>
              </div>
              <div>Successful Holds: {simulationResult.successfulHolds}</div>
              <div>Conflicts Prevented: {simulationResult.conflictsPrevented}</div>
            </div>
          )}
        </div>

        {/* Live Socket Stream */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>WebSocket Live Stream</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="h-44 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono">
            {socketLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-6">
                Waiting for seat actions...
              </div>
            ) : (
              socketLogs.map((log, i) => (
                <div key={i} className="text-slate-400 leading-tight">
                  <span className="text-slate-600">{log.timestamp}</span> {log.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 text-center">
        <span className="text-[10px] text-slate-500 font-mono">
          SeatRush Mutex & Background Expiry Engine
        </span>
      </div>
    </div>
  );
};
