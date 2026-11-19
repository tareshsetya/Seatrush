import React from 'react';
import { Booking } from '../types';
import { CheckCircle2, Calendar, MapPin, Download, Share2, Ticket, ArrowLeft } from 'lucide-react';

interface TicketReceiptProps {
  booking: Booking;
  isReplay?: boolean;
  onBackToEvents: () => void;
}

export const TicketReceipt: React.FC<TicketReceiptProps> = ({
  booking,
  isReplay,
  onBackToEvents,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 flex flex-col items-center animate-fade-in">
      {/* Success Notification */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20 animate-bounce-short">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white">Booking Confirmed!</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          {isReplay
            ? 'Your demo booking request was safely replayed without issuing a second ticket!'
            : 'Your seats have been permanently locked and allocated in the database.'}
        </p>
      </div>

      {/* The Digital E-Ticket Pass */}
      <div className="w-full bg-slate-900 rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl relative">
        {/* Ticket Top Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-900/80 via-indigo-900/70 to-slate-900 border-b border-purple-500/20 relative">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Demo E-Ticket
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {booking.eventTitle}
              </h2>
            </div>
            <Ticket className="w-10 h-10 text-purple-400/60" />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>
                {booking.eventDate} • {booking.eventTime}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>{booking.venue}</span>
            </div>
          </div>
        </div>

        {/* Notched Tear-Line Separator */}
        <div className="relative flex items-center justify-between px-2 bg-slate-900 -my-3 z-10">
          <div className="w-6 h-6 rounded-full bg-slate-950 -ml-5 border-r border-purple-500/30" />
          <div className="w-full border-t-2 border-dashed border-slate-700 mx-2" />
          <div className="w-6 h-6 rounded-full bg-slate-950 -mr-5 border-l border-purple-500/30" />
        </div>

        {/* Ticket Details & QR Code */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-900/90">
          {/* Details */}
          <div className="sm:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                  Reference Code
                </span>
                <span className="text-base font-mono font-extrabold text-purple-300">
                  {booking.referenceNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                  Attendee
                </span>
                <span className="text-sm font-semibold text-white truncate block">
                  {booking.userName}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">
                Allocated Seats ({booking.seats.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.seats.map((seat) => (
                  <span
                    key={seat.id}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold"
                  >
                    Seat {seat.label} ({seat.tier})
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                  Demo Total
                </span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  ${booking.totalAmount}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                  Issued At
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Display honest demo reference; a scannable QR needs ticket verification infrastructure. */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-950 text-center">
            <Ticket className="w-12 h-12 text-slate-700 mb-2" />
            <span className="font-mono text-xs font-bold break-all">{booking.referenceNumber}</span>
            <span className="text-[10px] font-mono mt-2 text-slate-700">DEMO TICKET — NOT VALID FOR ENTRY</span>
          </div>
        </div>

        {/* Barcode Strip */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800/80 flex flex-col items-center">
          <div className="h-8 w-4/5 flex items-center justify-between opacity-70">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="h-full bg-slate-300"
                style={{
                  width: `${(i % 4) + 1}px`,
                  marginRight: `${(i % 3) + 1}px`,
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-500 tracking-widest mt-1">
            *{booking.id.toUpperCase()}*
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button
          onClick={handlePrint}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 flex items-center space-x-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Save / Print E-Ticket</span>
        </button>

        <button
          onClick={onBackToEvents}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center space-x-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Book Another Event</span>
        </button>
      </div>
    </div>
  );
};
