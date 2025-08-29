

import React, { useState, useEffect } from 'react';
import type { User, Friend } from '../types';
import { ICONS } from '../constants';
import { claimReferralEarnings, fetchFriends, inviteFriendForSpin } from '../services/api';

const FriendsPage: React.FC<{ user: User | null, setUser: (user: User) => void }> = ({ user, setUser }) => {
  const [claimed, setClaimed] = useState(user?.referralEarnings === 0);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [copyFeedback, setCopyFeedback] = useState('Copy link');
  const referralLink = 'https://t.me/cashubux_bot?start=ref12345';

  useEffect(() => {
    fetchFriends().then(setFriends);
  }, []);

  useEffect(() => {
    setClaimed(user?.referralEarnings === 0);
  }, [user]);

  const handleClaim = async () => {
    if (user && user.referralEarnings > 0 && !claimed) {
      const result = await claimReferralEarnings();
      if (result.success && result.user) {
        setUser(result.user);
        setClaimed(true);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback('Copy link'), 2000);
  };

  const handleShare = async () => {
    const result = await inviteFriendForSpin();
    if (result.success && result.user) {
        setUser(result.user);
        // Maybe add a toast here: "Thanks for sharing! +1 Spin!"
    }
    const url = encodeURIComponent(referralLink);
    const text = encodeURIComponent("Join me on CashUBux Bot and earn crypto together!");
    const telegramUrl = `https://t.me/share/url?url=${url}&text=${text}`;
    window.open(telegramUrl, '_blank');
  };
  
  const claimableEarnings = user?.referralEarnings || 0;

  return (
    <div className="space-y-8">
      {/* Claim section */}
      <section className="bg-slate-800 p-6 rounded-xl text-center">
        <p className="text-slate-300 text-lg">Your claimable earnings</p>
        <div className="flex justify-center items-center space-x-2 my-2">
            <div className="w-8 h-8 text-yellow-400">{ICONS.coin}</div>
            <p className="text-5xl font-bold text-white">{claimableEarnings.toLocaleString()}</p>
        </div>
        <button
          onClick={handleClaim}
          disabled={claimableEarnings === 0 || claimed}
          className="mt-4 w-full bg-green-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {claimed ? 'Claimed!' : 'Claim'}
        </button>
      </section>

      {/* Invite section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Invite friends, get coins & spins!</h2>
        <div className="bg-slate-800 p-6 rounded-xl space-y-4">
          <p className="text-slate-300 text-center text-base">
            You'll receive <span className="text-white font-bold">10%</span> of the coins your friends earn, and get <span className="text-white font-bold">+1 Spin</span> for each invite (max 50/day).
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button onClick={handleCopy} className="flex-1 bg-slate-700 text-white font-semibold py-3 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2">
              {ICONS.copy}
              <span>{copyFeedback}</span>
            </button>
            <button onClick={handleShare} className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
              {ICONS.telegram}
              <span>Share & Get Spin</span>
            </button>
          </div>
        </div>
      </section>

      {/* Friends list section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Your Friends ({friends.length})</h2>
        <div className="bg-slate-800 p-4 rounded-xl space-y-1">
          {friends.length > 0 ? (
            friends.map(friend => (
              <div key={friend.id} className="flex items-center space-x-4 p-2 rounded-lg">
                <div className="text-green-500 bg-slate-700 p-2 rounded-full">
                  <div className="w-6 h-6">{ICONS.user}</div>
                </div>
                <span className="text-white font-semibold text-lg">{friend.name}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-4">You haven't invited any friends yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default FriendsPage;