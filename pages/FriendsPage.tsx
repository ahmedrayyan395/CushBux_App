import React, { useState, useEffect } from 'react';
import type { User, Friend } from '../types';
import { ICONS } from '../constants';
import { claimReferralEarnings, fetchFriends, inviteFriendForSpin, getReferralInfo } from '../services/api';

interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  referral_count: number;
  claimable_earnings: number;
  total_earnings: number;
  today_invites: number;
  max_daily_invites: number;
}

const FriendsPage: React.FC<{ user: User | null, setUser: (user: User) => void }> = ({ user, setUser }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('Copy link');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [friendsData, referralData] = await Promise.all([
        fetchFriends(),
        getReferralInfo()
      ]);
      setFriends(friendsData);
      setReferralInfo(referralData);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!user || !user.referral_earnings) return;
    
    setClaiming(true);
    try {
      const result = await claimReferralEarnings();
      if (result.success && result.user) {
        setUser(result.user);
        // Refresh referral info
        const newReferralInfo = await getReferralInfo();
        setReferralInfo(newReferralInfo);
      }
    } catch (error) {
      console.error('Failed to claim earnings:', error);
    } finally {
      setClaiming(false);
    }
  };

  const handleCopy = () => {
    if (!referralInfo?.referral_link) return;
    
    navigator.clipboard.writeText(referralInfo.referral_link);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback('Copy link'), 2000);
  };

  const handleShare = async () => {
    if (!referralInfo?.referral_link) return;
    
    setSharing(true);
    try {
      const result = await inviteFriendForSpin();
      if (result.success && result.user) {
        setUser(result.user);
        // Refresh referral info to update today's invite count
        const newReferralInfo = await getReferralInfo();
        setReferralInfo(newReferralInfo);
      }
      
      const url = encodeURIComponent(referralInfo.referral_link);
      const text = encodeURIComponent("Join me on CashUBux Bot and earn crypto together!");
      const telegramUrl = `https://t.me/share/url?url=${url}&text=${text}`;
      window.open(telegramUrl, '_blank');
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setSharing(false);
    }
  };

  const claimableEarnings = user?.referral_earnings || 0;
  const referralLink = referralInfo?.referral_link || 'https://t.me/@CashUBux_bot?start=ref_loading';
  const todayInvites = referralInfo?.today_invites || 0;
  const maxDailyInvites = referralInfo?.max_daily_invites || 50;
  const totalFriends = referralInfo?.referral_count || 0;
  const totalEarnings = referralInfo?.total_earnings || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading referral information...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white p-4 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-slate-400">Invite friends and earn together</p>
      </div>

      {/* Claim Section */}
      <section className="bg-slate-800 p-6 rounded-xl text-center">
        <p className="text-slate-300 text-lg">Your claimable earnings</p>
        <div className="flex justify-center items-center space-x-2 my-4">
          <div className="w-8 h-8 text-yellow-400">{ICONS.coin}</div>
          <p className="text-5xl font-bold text-white">{claimableEarnings.toLocaleString()}</p>
        </div>
        <button
          onClick={handleClaim}
          disabled={claimableEarnings === 0 || claiming}
          className="mt-4 w-full bg-green-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {claiming ? 'Claiming...' : claimableEarnings === 0 ? 'No earnings to claim' : 'Claim Earnings'}
        </button>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl text-center">
          <div className="w-6 h-6 text-blue-400 mx-auto mb-2">{ICONS.users}</div>
          <p className="text-slate-300 text-sm">Total Friends</p>
          <p className="text-2xl font-bold text-white">{totalFriends}</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl text-center">
          <div className="w-6 h-6 text-green-400 mx-auto mb-2">{ICONS.wallet}</div>
          <p className="text-slate-300 text-sm">Total Earned</p>
          <p className="text-2xl font-bold text-white">{totalEarnings.toLocaleString()}</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl text-center">
          <div className="w-6 h-6 text-purple-400 mx-auto mb-2">{ICONS.calendar}</div>
          <p className="text-slate-300 text-sm">Today's Invites</p>
          <p className="text-2xl font-bold text-white">{todayInvites}/{maxDailyInvites}</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl text-center">
          <div className="w-6 h-6 text-yellow-400 mx-auto mb-2">{ICONS.star}</div>
          <p className="text-slate-300 text-sm">Your Code</p>
          <p className="text-xl font-bold text-white font-mono">{referralInfo?.referral_code || 'Loading...'}</p>
        </div>
      </section>

      {/* Invite Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Invite friends, get coins & spins!</h2>
        <div className="bg-slate-800 p-6 rounded-xl space-y-4">
          <div className="text-center">
            <p className="text-slate-300 text-base">
              You'll receive <span className="text-white font-bold">10%</span> of the coins your friends earn
            </p>
            <p className="text-slate-300 text-base mt-2">
              Get <span className="text-white font-bold">+1 Spin</span> for each invite (max 50/day)
            </p>
          </div>
          
          {/* Referral Link */}
          <div className="bg-slate-700 p-3 rounded-lg">
            <p className="text-slate-400 text-sm mb-2">Your referral link:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 bg-slate-600 text-white p-2 rounded text-sm font-mono truncate"
              />
              <button
                onClick={handleCopy}
                className="bg-slate-600 text-white p-2 rounded hover:bg-slate-500 transition-colors"
                title="Copy link"
              >
                {ICONS.copy}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleCopy}
              disabled={!referralInfo}
              className="flex-1 bg-slate-700 text-white font-semibold py-3 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {ICONS.copy}
              <span>{copyFeedback}</span>
            </button>
            
            <button
              onClick={handleShare}
              disabled={todayInvites >= maxDailyInvites || sharing || !referralInfo}
              className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {sharing ? ICONS.spinner : ICONS.telegram}
              <span>
                {todayInvites >= maxDailyInvites ? 'Limit Reached' : sharing ? 'Sharing...' : 'Share & Get Spin'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Friends List Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Your Friends ({friends.length})</h2>
          <button
            onClick={loadData}
            className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600 transition-colors"
            title="Refresh list"
          >
            {ICONS.refresh}
          </button>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl space-y-3">
          {friends.length > 0 ? (
            friends.map((friend, index) => (
              <div key={friend.id || index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {friend.name ? friend.name.charAt(0).toUpperCase() : 'F'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{friend.name || 'Unknown Friend'}</p>
                    <p className="text-slate-400 text-sm">
                      Earned: {friend.earnings_generated?.toLocaleString() || 0} coins
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 text-sm font-semibold">
                    +{Math.floor((friend.earnings_generated || 0) * 0.1).toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-xs">your earnings</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 text-slate-400 mx-auto mb-4">{ICONS.users}</div>
              <p className="text-slate-400">You haven't invited any friends yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Share your referral link to start earning together!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-800 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-4">How it works</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <p className="text-slate-300">
              Share your unique referral link with friends
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <p className="text-slate-300">
              Friends join using your link and start completing tasks
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <p className="text-slate-300">
              You earn <span className="text-white font-semibold">10%</span> of all coins they earn
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">4</span>
            </div>
            <p className="text-slate-300">
              Get <span className="text-white font-semibold">+1 spin</span> for each successful invite
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FriendsPage;