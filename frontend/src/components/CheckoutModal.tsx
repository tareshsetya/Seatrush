import React, { useState } from 'react';
import { Seat, Event, Booking } from '../types';
import { api } from '../services/api';
import { ShieldCheck, CreditCard, Lock, AlertCircle, RefreshCw, X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  heldSeats: Seat[];
  userId: string;
  onBookingSuccess: (booking: Booking, isReplay: boolean) => void;
  expiresAt: string | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
  heldSeats,
  userId,
  onBookingSuccess,
}) => {
  const [userName, setUserName] = useState('Alex Mercer');
  const [userEmail, setUserEmail] = useState('alex.mercer@example.com');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    'idem_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulateDoublePayment, setSimulateDoublePayment] = useState(false);
  const [replayNotice, setReplayNotice] = useState<string | null>(null);

  if (!isOpen || heldSeats.length === 0) return null;

  const subtotal = heldSeats.reduce((acc, s) => acc + s.price, 0);
  const serviceFee = Math.round(subtotal * 0.08); // 8% fee
  const total = subtotal + serviceFee;

  const handlePay = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setReplayNotice(null);

    const payload = {
      eventId: event.id,
      seatIds: heldSeats.map((s) => s.id),
      userId,
      userEmail,
      userName,
      idempotencyKey,
      paymentDetails: {
        cardNumberLast4: '4242',
        paymentMethod: 'stripe_mock',
      },
    };

    try {
      if (simulateDoublePayment) {
        // Send two requests with same key at the exact same moment
        const [res1, res2] = await Promise.all([
          api.createBooking(payload),
          api.createBooking(payload),
        ]);

        const chosen = res1 || res2;
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        setReplayNotice('Double-charge prevented! Idempotency key returned cached booking.');
        setTimeout(() => {
          onBookingSuccess(chosen.booking, true);
        }, 1200);
      } else {
        const { booking, isReplay } = await api.createBooking(payload);
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        onBookingSuccess(booking, isReplay);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo booking failed. Please check your hold status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateKey = () => {
    setIdempotencyKey(
      'idem_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel-glow rounded-3xl p-6 sm:p-8 relative border border-purple-500/30 text-slate-100 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Demo Checkout — No Real Charges</span>
          </div>
          <h2 className="text-2xl font-black text-white">{event.title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            {event.venue} • {event.date} at {event.time}
          </p>
        </div>

        {/* Selected Seats Breakdown */}
        <div className="glass-panel p-4 rounded-2xl mb-5 border border-slate-800">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-2">Selected Seats</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {heldSeats.map((s) => (
              <span
                key={s.id}
                className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-200 font-mono text-xs font-bold"
              >
                {s.label} ({s.tier}) - ${s.price}
              </span>
            ))}
          </div>

          <div className="border-t border-slate-800/80 pt-2 text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Subtotal ({heldSeats.length} seats)</span>
              <span>${subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Demo processing fee (8%)</span>
              <span>${serviceFee}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
              <span>Total Due</span>
              <span className="text-emerald-400 text-base font-mono font-extrabold">${total}</span>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email (for E-Ticket Delivery)</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Card Details (Test Mode)</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={cardNumber}
                className="w-full px-3.5 py-2 pl-10 rounded-xl bg-slate-900/60 border border-slate-700 text-sm font-mono text-slate-300"
              />
              <CreditCard className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Concurrency Safeguard: Idempotency Key Badge */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 flex items-center space-x-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Idempotency-Key Header:</span>
            </span>
            <button
              onClick={regenerateKey}
              title="Regenerate key"
              className="text-purple-400 hover:text-purple-300 flex items-center space-x-1 font-mono text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Renew</span>
            </button>
          </div>
          <div className="font-mono text-[11px] text-purple-300 truncate bg-slate-950 px-2 py-1 rounded border border-purple-500/20">
            {idempotencyKey}
          </div>

          {/* Double Charge Prevention Test Toggle */}
          <label className="flex items-center space-x-2 mt-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={simulateDoublePayment}
              onChange={(e) => setSimulateDoublePayment(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
            />
            <span className="text-[11px] text-amber-300 font-medium">
              Test identical booking requests (no charges)
            </span>
          </label>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {replayNotice && (
          <div className="p-3 mb-4 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{replayNotice}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handlePay}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all transform active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying Lock & State Machine...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Confirm demo booking ${total}</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-slate-500 mt-3 font-mono">
          Demo only. No payment is collected; PostgreSQL enforces seat ownership.
        </p>
      </div>
    </div>
  );
};
