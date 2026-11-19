import React from 'react';
import { Ticket, Activity, Cpu, ShieldCheck, Zap, MapPin } from 'lucide-react';

interface NavbarProps {
  currentTab: 'events' | 'proof-lab' | 'admin' | 'architecture' | 'profile' | 'login';
  setCurrentTab: (tab: 'events' | 'proof-lab' | 'admin' | 'architecture' | 'profile' | 'login') => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  onOpenInspector: () => void;
  inspectorOpen: boolean;
  activeHoldCount: number;
  onLogout?: () => void; // optional for when user is logged in
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedCity,
  setSelectedCity,
  onOpenInspector,
  inspectorOpen,
  activeHoldCount,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 py-3">
        {/* Left: Brand & City Selector */}
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => setCurrentTab('events')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight text-white">
                  Seat<span className="text-purple-400">Rush</span>
                </span>
                <span className="text-[9px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/30">
                  DISTRICT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                High-Concurrency Live Ticketing
              </p>
            </div>
          </div>

          {/* City Selector */}
          <div className="hidden md:flex items-center space-x-1 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 cursor-pointer">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="London" className="bg-slate-900">London, UK</option>
              <option value="Los Angeles" className="bg-slate-900">Los Angeles, CA</option>
              <option value="Silverstone" className="bg-slate-900">Silverstone, UK</option>
              <option value="Mumbai" className="bg-slate-900">Mumbai, IN</option>
            </select>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5">
          <button
            onClick={() => setCurrentTab('events')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              currentTab === 'events'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Explore
          </button>
          {/* Profile / Logout */}
          {onLogout ? (
            <>
              <button
                onClick={() => setCurrentTab('profile')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  currentTab === 'profile'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                Profile
              </button>
              <button
                onClick={onLogout}
                className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-500"
              >
                Log Out
              </button>
            </>
          ) : null}
        </nav>

        {/* Right: Inspector */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sync</span>
          </div>
          <button
            onClick={onOpenInspector}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
              inspectorOpen
                ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-purple-500 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Engine Inspector</span>
            {activeHoldCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black px-1.5 text-[10px] rounded-full">
                {activeHoldCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
