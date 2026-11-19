import React, { useState, useEffect } from 'react';
import { Event, Booking, UserProfile } from './types';
import { api, getOrCreateUserId } from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { EventsPage } from './pages/EventsPage';
import { EventBookingPage } from './pages/EventBookingPage';
import { TicketReceipt } from './components/TicketReceipt';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { ProofLabPage } from './pages/ProofLabPage';
import { ConcurrencyInspector } from './components/ConcurrencyInspector';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  // Load mock user profile from localStorage if present
  const [user, setUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('seatrush_user');
    return stored ? JSON.parse(stored) as UserProfile : null;
  });

  const [currentTab, setCurrentTab] = useState<'events' | 'proof-lab' | 'admin' | 'architecture' | 'profile' | 'login'>(
    user ? 'events' : 'login'
  );
  const [selectedCity, setSelectedCity] = useState<string>('London');
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{ booking: Booking; isReplay: boolean } | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [activeHoldCount, setActiveHoldCount] = useState(0);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load events when a user is logged in
  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const handleLoginSuccess = () => {
    const stored = localStorage.getItem('seatrush_user');
    setUser(stored ? JSON.parse(stored) as UserProfile : null);
    setCurrentTab('events');
  };

  const handleLogout = () => {
    localStorage.removeItem('seatrush_user');
    localStorage.removeItem('seatrush_user_id');
    setUser(null);
    setCurrentTab('login');
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setConfirmedBooking(null);
  };

  const handleBookingSuccess = (booking: Booking, isReplay: boolean) => {
    setConfirmedBooking({ booking, isReplay });
    loadEvents();
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setConfirmedBooking(null);
    loadEvents();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white font-sans">
      {/* Top Navigation – only show when a user is logged in */}
      {user && (
        <Navbar
          currentTab={currentTab as any}
          setCurrentTab={(tab) => {
            setCurrentTab(tab as any);
            if (tab !== 'events') {
              setSelectedEvent(null);
              setConfirmedBooking(null);
            }
          }}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          onOpenInspector={() => setInspectorOpen(!inspectorOpen)}
          inspectorOpen={inspectorOpen}
          activeHoldCount={activeHoldCount}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}
        {currentTab === 'profile' && user && <ProfilePage user={user} onLogout={handleLogout} />}
        {currentTab === 'events' && (
          <>{
            confirmedBooking ? (
              <TicketReceipt
                booking={confirmedBooking.booking}
                isReplay={confirmedBooking.isReplay}
                onBackToEvents={handleBackToEvents}
              />
            ) : selectedEvent ? (
              <EventBookingPage
                event={selectedEvent}
                userId={user?.id || ''}
                onBack={handleBackToEvents}
                onBookingSuccess={handleBookingSuccess}
              />
            ) : (
              <EventsPage
                events={events}
                onSelectEvent={handleSelectEvent}
                isLoading={loadingEvents}
                selectedCity={selectedCity}
              />
            )}
          </>
        )}
        {currentTab === 'proof-lab' && <ProofLabPage />}
        {currentTab === 'admin' && <AdminDashboardPage />}
        {currentTab === 'architecture' && <ArchitecturePage />}
      </main>

      {/* Slide-out Concurrency Engine Inspector */}
      <ConcurrencyInspector
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        activeHoldCount={activeHoldCount}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
