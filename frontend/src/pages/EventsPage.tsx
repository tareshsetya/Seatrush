import React, { useState } from 'react';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { Sparkles, Flame, Music, Trophy, Compass, ShieldCheck, Zap } from 'lucide-react';

interface EventsPageProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  isLoading: boolean;
  selectedCity: string;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  onSelectEvent,
  isLoading,
  selectedCity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    { label: 'All', icon: <Compass className="w-3.5 h-3.5" /> },
    { label: 'Concert', icon: <Music className="w-3.5 h-3.5" /> },
    { label: 'Sports', icon: <Trophy className="w-3.5 h-3.5" /> },
  ];

  const filteredEvents =
    selectedCategory === 'All'
      ? events
      : events.filter((e) => e.category === selectedCategory);

  const heroEvent = events[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* District-Style Hero Spotlight Banner */}
      {heroEvent && (
        <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl group">
          <div className="relative h-80 sm:h-96 w-full overflow-hidden">
            <img
              src={heroEvent.bannerUrl}
              alt={heroEvent.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

            <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end max-w-2xl">
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center space-x-1 shadow-lg shadow-rose-600/30">
                  <Flame className="w-3 h-3" />
                  <span>DISTRICT HEADLINER</span>
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-900/80 text-purple-300 border border-purple-500/30">
                  {heroEvent.venue}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {heroEvent.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 line-clamp-2">
                {heroEvent.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onSelectEvent(heroEvent)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition-all transform hover:scale-105"
                >
                  Select Seats • From ${heroEvent.pricing.STANDARD}
                </button>

                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono font-bold bg-slate-950/80 px-3 py-2 rounded-xl border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{heroEvent.availableSeats} Seats Left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Discovery Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white">Live In {selectedCity}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time verified seat inventory with 10-minute hold protection
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                selectedCategory === cat.label
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onSelect={onSelectEvent} />
          ))}
        </div>
      )}
    </div>
  );
};
