import React, { useState, useEffect } from 'react';
import { Event, Seat, Booking } from '../types';
import { api } from '../services/api';
import { socketClient } from '../services/socket';
import { SeatMap } from '../components/SeatMap';
import { HoldTimer } from '../components/HoldTimer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ArrowLeft, Calendar, MapPin, Users, AlertCircle, RefreshCw } from 'lucide-react';

interface EventBookingPageProps {
  event: Event;
  userId: string;
  onBack: () => void;
  onBookingSuccess: (booking: Booking, isReplay: boolean) => void;
}

export const EventBookingPage: React.FC<EventBookingPageProps> = ({
  event,
  userId,
  onBack,
  onBookingSuccess,
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [loadingSeatId, setLoadingSeatId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Filter seats currently held by this user
  const heldByMe = seats.filter((s) => s.status === 'HELD' && s.heldBy === userId);
  // Each independently selected seat can have a different deadline. Show the earliest.
  const earliestHoldExpiry = heldByMe.map(s => s.heldUntil).filter((v): v is string => !!v).sort()[0] || holdExpiresAt;

  // Fetch seats and initialize socket listeners
  const loadSeats = async () => {
    try {
      const data = await api.getSeats(event.id);
      setSeats(data);

      // Check if user already holds any active seats
      const userHolds = data.filter((s) => s.status === 'HELD' && s.heldBy === userId);
      if (userHolds.length > 0 && userHolds[0].heldUntil) {
        setHoldExpiresAt(userHolds[0].heldUntil);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load seat layout.');
    } finally {
      setLoadingSeats(false);
    }
  };

  useEffect(() => {
    loadSeats();

    // Join real-time room for this event
    socketClient.joinEvent(event.id);

    const socket = socketClient.getSocket();

    const handleSeatUpdate = (payload: { eventId: string; updatedSeats: Seat[] }) => {
      if (payload.eventId === event.id) {
        setSeats((prev) => {
          const updatedMap = new Map(payload.updatedSeats.map((s) => [s.id, s]));
          return prev.map((seat) => (updatedMap.has(seat.id) ? updatedMap.get(seat.id)! : seat));
        });
      }
    };

    socket.on('SEATS_UPDATED', handleSeatUpdate);
    socket.on('connect', loadSeats); // refresh if updates were missed while offline

    return () => {
      socketClient.leaveEvent(event.id);
      socket.off('SEATS_UPDATED', handleSeatUpdate);
      socket.off('connect', loadSeats);
    };
  }, [event.id, userId]);

  // Handle Seat Click
  const handleSeatClick = async (seat: Seat) => {
    setErrorMessage(null);

    // If held by me -> Release it
    if (seat.status === 'HELD' && seat.heldBy === userId) {
      setLoadingSeatId(seat.id);
      try {
        await api.releaseSeats(event.id, [seat.id], userId);
        const remaining = heldByMe.filter((s) => s.id !== seat.id);
        if (remaining.length === 0) {
          setHoldExpiresAt(null);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to release seat.');
      } finally {
        setLoadingSeatId(null);
      }
      return;
    }

    // If Available -> Hold it
    if (seat.status === 'AVAILABLE') {
      setLoadingSeatId(seat.id);
      try {
        const response = await api.holdSeats(event.id, [seat.id], userId, 600);
        setHoldExpiresAt(response.holdExpiresAt);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to acquire hold. Seat may be contested.');
      } finally {
        setLoadingSeatId(null);
      }
    }
  };

  // Release all holds
  const handleReleaseAll = async () => {
    if (heldByMe.length === 0) return;
    try {
      await api.releaseSeats(
        event.id,
        heldByMe.map((s) => s.id),
        userId
      );
      setHoldExpiresAt(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to release seats.');
    }
  };

  // Hold Expired callback
  const handleHoldExpired = () => {
    setHoldExpiresAt(null);
    setErrorMessage('Your 10-minute hold window expired. Seats were released to the public queue.');
    loadSeats();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative pb-32">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </button>

        <button
          onClick={loadSeats}
          title="Refresh seating map"
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh Grid</span>
        </button>
      </div>

      {/* Event Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
            {event.category} • Live Arena Seating
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-2">{event.title}</h1>
          <p className="text-xs text-purple-300 font-medium mt-0.5">{event.subtitle}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>
                {event.date} at {event.time}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>
                {event.venue}, {event.location}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-400 font-mono font-semibold">
              <Users className="w-4 h-4" />
              <span>{seats.filter((s) => s.status === 'AVAILABLE').length} Available Seats</span>
            </div>
          </div>
        </div>

        {/* Pricing Tiers Summary Card */}
        <div className="relative z-10 glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-4 text-xs">
          <div>
            <div className="text-pink-400 font-bold">VIP</div>
            <div className="text-white font-mono font-extrabold text-base">${event.pricing.VIP}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-purple-400 font-bold">Premium</div>
            <div className="text-white font-mono font-extrabold text-base">${event.pricing.PREMIUM}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-emerald-400 font-bold">Standard</div>
            <div className="text-white font-mono font-extrabold text-base">${event.pricing.STANDARD}</div>
          </div>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Seat Map */}
      {loadingSeats ? (
        <div className="w-full h-96 glass-panel rounded-3xl flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading venue seat inventory...</span>
        </div>
      ) : (
        <SeatMap
          seats={seats}
          userId={userId}
          onSeatClick={handleSeatClick}
          loadingSeatId={loadingSeatId}
        />
      )}

      {/* Floating 10-Minute Hold Timer Bar (District Style) */}
      <HoldTimer
        expiresAt={earliestHoldExpiry}
        heldCount={heldByMe.length}
        totalPrice={heldByMe.reduce((acc, s) => acc + s.price, 0)}
        onExpire={handleHoldExpired}
        onRelease={handleReleaseAll}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={event}
        heldSeats={heldByMe}
        userId={userId}
        expiresAt={earliestHoldExpiry}
        onBookingSuccess={(booking, isReplay) => {
          setIsCheckoutOpen(false);
          onBookingSuccess(booking, isReplay);
        }}
      />
    </div>
  );
};
