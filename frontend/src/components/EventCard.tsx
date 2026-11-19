import React from 'react';
import { Event } from '../types';
import { Calendar, MapPin, ArrowRight, Zap, Flame } from 'lucide-react';

interface EventCardProps {
  event: Event;
  onSelect: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  const isFastFilling = event.availableSeats < 50;

  return (
    <div
      onClick={() => onSelect(event)}
      className="group relative rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/15 cursor-pointer flex flex-col justify-between"
    >
      {/* Top Banner Image with Gradient Scrim */}
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Category Pill */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-purple-300 border border-purple-500/40">
            {event.category}
          </span>
        </div>

        {/* Fast Filling / Demand Indicator */}
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 backdrop-blur-md shadow-lg ${
              isFastFilling
                ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
                : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
            }`}
          >
            {isFastFilling ? (
              <>
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce-short" />
                <span>Fast Filling</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selling Fast</span>
              </>
            )}
          </span>
        </div>

        {/* Live Seat Inventory Bar at Base of Image */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-300 backdrop-blur-md bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Available Inventory</span>
          <span className="text-emerald-400 font-bold">{event.availableSeats} / {event.totalSeats} seats</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-purple-400/90 font-semibold mt-0.5">{event.artist}</p>
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          <div className="mt-4 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span>{event.venue}, {event.location}</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
              Tickets From
            </span>
            <span className="text-xl font-black text-white font-mono">
              ${event.pricing.STANDARD}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(event);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-lg shadow-purple-600/25 transition-all transform group-hover:translate-x-1"
          >
            <span>Book Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
