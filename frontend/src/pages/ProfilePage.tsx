// ProfilePage.tsx – display mock user profile
import React from 'react';
import { UserProfile } from '../types';

interface ProfilePageProps {
  user: UserProfile;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 p-8 shadow-xl text-slate-100">
        <h2 className="mb-6 text-center text-2xl font-black text-white">My Profile</h2>
        <div className="flex items-center space-x-4 mb-6">
          <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full" />
          <div>
            <p className="text-lg font-bold">{user.name}</p>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>
        <ul className="mb-6 space-y-2 text-sm">
          <li>Member tier: <span className="font-medium text-purple-300">{user.memberTier}</span></li>
          <li>Joined: <span className="font-medium text-purple-300">{new Date(user.joinedDate).toLocaleDateString()}</span></li>
          <li>Loyalty points: <span className="font-medium text-purple-300">{user.loyaltyPoints}</span></li>
        </ul>
        <button
          onClick={onLogout}
          className="w-full rounded bg-gradient-to-r from-rose-600 to-rose-800 py-2 font-bold text-white hover:from-rose-500 hover:to-rose-700"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};
