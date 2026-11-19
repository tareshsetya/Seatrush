import React from 'react';
import { Clock, AlertTriangle, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';

interface HoldTimerProps {
  expiresAt: string | null;
  heldCount: number;
  totalPrice?: number;
  onExpire: () => void;
  onRelease: () => void;
  onCheckout: () => void;
}

export const HoldTimer: React.FC<HoldTimerProps> = ({
  expiresAt,
  heldCount,
  totalPrice = 0,
  onExpire,
  onRelease,
  onCheckout,
}) => {
  const { formatted, isUrgent, isExpired } = useCountdown(expiresAt, onExpire);

  if (!expiresAt || heldCount === 0 || isExpired) {
    return null;
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div
          className={`rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-2xl border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isUrgent
              ? 'bg-rose-950/95 border-rose-500/60 shadow-rose-950/50'
              : 'bg-slate-900/95 border-purple-500/40 shadow-purple-950/50'
          }`}
        >
          {/* Left: Ticker & Selected Summary */}
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-lg shadow-inner shrink-0 ${
                isUrgent
                  ? 'bg-rose-900/80 text-rose-300 border border-rose-500/50 animate-pulse'
                  : 'bg-purple-950/90 text-purple-300 border border-purple-500/40'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white">
                  {formatted}
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                  {heldCount} {heldCount === 1 ? 'Seat' : 'Seats'} Locked
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                {isUrgent ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 inline" />
                    <span className="text-rose-300 font-semibold">Hold expiring! Finalize checkout.</span>
                  </>
                ) : (
                  <span>Locked in Redis for 10 minutes • Zero double-booking</span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Price & Checkout Trigger */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
            {totalPrice > 0 && (
              <div className="text-right mr-2 hidden sm:block">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Due</span>
                <span className="text-xl font-mono font-black text-emerald-400">${totalPrice}</span>
              </div>
            )}

            <button
              onClick={onRelease}
              title="Release holds"
              className="px-3 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Release</span>
            </button>

            <button
              onClick={onCheckout}
              className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95 ${
                isUrgent
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
              }`}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
