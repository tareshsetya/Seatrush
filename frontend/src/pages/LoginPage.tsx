// LoginPage.tsx – mock authentication using localStorage
import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }
    const mockUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: email.split('@')[0],
      email,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}`,
      memberTier: 'District Member',
      joinedDate: new Date().toISOString(),
      loyaltyPoints: 0,
    };
    localStorage.setItem('seatrush_user', JSON.stringify(mockUser));
    localStorage.setItem('seatrush_user_id', mockUser.id);
    onLoginSuccess();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <form className="w-full max-w-md rounded-xl bg-slate-900 p-8 shadow-xl" onSubmit={handleSubmit}>
        <h2 className="mb-6 text-center text-2xl font-black text-white">Welcome to SeaRush</h2>
        {error && <p className="mb-4 rounded bg-rose-900 p-2 text-sm text-rose-300">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-400" htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1 block w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600" required />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="mt-1 block w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600" required />
        </div>
        <button type="submit" className="w-full rounded bg-gradient-to-r from-purple-600 to-indigo-600 py-2 font-bold text-white hover:from-purple-500 hover:to-indigo-500">Sign In</button>
      </form>
    </div>
  );
};
