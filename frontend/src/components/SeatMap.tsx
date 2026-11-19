import React, { useState } from 'react';
import { Seat, SeatTier } from '../types';
import { Lock, Sparkles, User, Shield, Info } from 'lucide-react';

interface SeatMapProps {
  seats: Seat[];
  userId: string;
  onSeatClick: (seat: Seat) => void;
  loadingSeatId: string | null;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  userId,
  onSeatClick,
  loadingSeatId,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  // Group seats by row
  const rowsMap = new Map<string, Seat[]>();
  for (const seat of seats) {
    if (!rowsMap.has(seat.row)) {
      rowsMap.set(seat.row, []);
    }
    rowsMap.get(seat.row)!.push(seat);
  }

  // Sort rows and columns
  const sortedRows = Array.from(rowsMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  for (const [, rowSeats] of sortedRows) {
    rowSeats.sort((a, b) => a.col - b.col);
  }

  const getSeatStatusDetails = (seat: Seat) => {
    if (seat.status === 'BOOKED') {
      return {
        label: 'Booked',
        classes: 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60',
        icon: <Lock className="w-2.5 h-2.5" />,
      };
    }

    if (seat.status === 'HELD') {
      if (seat.heldBy === userId) {
        return {
          label: 'Held By You',
          classes:
            'bg-blue-600 text-white border-2 border-blue-300 shadow-md shadow-blue-500/40 ring-2 ring-blue-500/20 font-bold',
          icon: <User className="w-2.5 h-2.5" />,
        };
      }
      return {
        label: 'Held by Another',
        classes:
          'bg-amber-600 text-amber-100 border border-amber-400 cursor-not-allowed opacity-90 animate-pulse',
        icon: <Lock className="w-2.5 h-2.5" />,
      };
    }

    // Available by tier
    if (seat.tier === 'VIP') {
      return {
        label: 'Available VIP',
        classes:
          'bg-pink-950/80 hover:bg-pink-600 text-pink-200 hover:text-white border border-pink-500/50 shadow-sm',
        icon: <Sparkles className="w-2.5 h-2.5 text-pink-400" />,
      };
    }

    if (seat.tier === 'PREMIUM') {
      return {
        label: 'Available Premium',
        classes:
          'bg-purple-950/80 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/50 shadow-sm',
        icon: <Shield className="w-2.5 h-2.5 text-purple-400" />,
      };
    }

    return {
      label: 'Available Standard',
      classes:
        'bg-emerald-950/80 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 shadow-sm',
      icon: null,
    };
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Stage Visual */}
      <div className="w-full max-w-3xl mb-12 flex flex-col items-center">
        <div className="w-4/5 h-12 rounded-b-3xl bg-gradient-to-b from-purple-500/20 via-purple-600/10 to-transparent border-b-2 border-x-2 border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-purple-300 flex items-center space-x-2">
            <span>STAGE & PERFORMANCE AREA</span>
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-2 font-mono">
          All eyes facing front stage • Sound & visual optimized
        </div>
      </div>

      {/* Seat Map Legend */}
      <div className="w-full max-w-3xl mb-8 flex flex-wrap items-center justify-center gap-4 text-xs glass-panel px-4 py-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-emerald-900 border border-emerald-500/60" />
          <span className="text-slate-300">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-blue-600 border border-blue-300 shadow-sm" />
          <span className="text-slate-300 font-semibold">Held By You</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-amber-600 border border-amber-400 animate-pulse" />
          <span className="text-slate-300">Held by Others</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
          <span className="text-slate-500">Booked</span>
        </div>
        <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />
        <div className="flex items-center space-x-1.5 text-pink-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-pink-500"></span>
          <span>VIP</span>
        </div>
        <div className="flex items-center space-x-1.5 text-purple-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          <span>Premium</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Standard</span>
        </div>
      </div>

      {/* The Interactive Grid */}
      <div className="w-full max-w-4xl overflow-x-auto pb-6 flex flex-col items-center">
        <div className="min-w-[650px] p-6 glass-panel rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col items-center space-y-3">
          {sortedRows.map(([rowLetter, rowSeats], idx) => {
            const rowTier: SeatTier = idx < 2 ? 'VIP' : idx < 5 ? 'PREMIUM' : 'STANDARD';

            return (
              <div key={rowLetter} className="flex items-center space-x-2 sm:space-x-3">
                {/* Row Letter Indicator */}
                <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                  {rowLetter}
                </span>

                {/* Left Aisle Group (seats 1-6) */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {rowSeats.slice(0, 6).map((seat) => {
                    const status = getSeatStatusDetails(seat);
                    const isLoading = loadingSeatId === seat.id;
                    const isDisabled =
                      seat.status === 'BOOKED' || (seat.status === 'HELD' && seat.heldBy !== userId);

                    return (
                      <button
                        key={seat.id}
                        disabled={isDisabled || isLoading}
                        onClick={() => onSeatClick(seat)}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[10px] font-mono font-semibold transition-all duration-150 relative ${
                          status.classes
                        } ${isLoading ? 'animate-pulse scale-95' : 'hover:scale-105'}`}
                      >
                        {isLoading ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          seat.label
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Center Aisle Spacer */}
                <div className="w-6 sm:w-10 flex items-center justify-center">
                  <div className="h-6 w-0.5 bg-slate-800/60" />
                </div>

                {/* Right Aisle Group (seats 7-12) */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {rowSeats.slice(6, 12).map((seat) => {
                    const status = getSeatStatusDetails(seat);
                    const isLoading = loadingSeatId === seat.id;
                    const isDisabled =
                      seat.status === 'BOOKED' || (seat.status === 'HELD' && seat.heldBy !== userId);

                    return (
                      <button
                        key={seat.id}
                        disabled={isDisabled || isLoading}
                        onClick={() => onSeatClick(seat)}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[10px] font-mono font-semibold transition-all duration-150 relative ${
                          status.classes
                        } ${isLoading ? 'animate-pulse scale-95' : 'hover:scale-105'}`}
                      >
                        {isLoading ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          seat.label
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Row Letter on Right */}
                <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                  {rowLetter}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Info Tooltip for Hovered Seat */}
      <div className="h-10 mt-3 flex items-center justify-center">
        {hoveredSeat ? (
          <div className="glass-panel px-4 py-1.5 rounded-full border border-purple-500/40 text-xs flex items-center space-x-3 shadow-lg animate-fade-in">
            <span className="font-mono font-bold text-purple-300">Seat {hoveredSeat.label}</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-300">{hoveredSeat.tier} Tier</span>
            <span className="text-slate-400">•</span>
            <span className="font-bold text-emerald-400">${hoveredSeat.price}</span>
            <span className="text-slate-400">•</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                hoveredSeat.status === 'AVAILABLE'
                  ? 'bg-emerald-950 text-emerald-300'
                  : hoveredSeat.status === 'HELD'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hoveredSeat.status === 'HELD' && hoveredSeat.heldBy === userId
                ? 'Held By You'
                : hoveredSeat.status}
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5" />
            <span>Hover over or click any available seat to hold it for 10 minutes</span>
          </div>
        )}
      </div>
    </div>
  );
};
