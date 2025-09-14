import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { ICONS, SPIN_WHEEL_PRIZES } from '../constants';
import SpinWheel from '../components/SpinWheel';
import BuySpinsModal from '../components/BuySpinsModal';
import SpinHistoryModal from '../components/SpinHistoryModal';
import PrizeNotification from '../components/PrizeNotification';
import { spinWheel, watchAdForSpin } from '../services/api';
import ProgressBar from '../components/ProgressBar';

// ... (The rest of the imports and the EarnSpinOption component are unchanged)
declare const show_9692552: (type?: 'pop') => Promise<void>;

const EarnSpinOption: React.FC<{
  icon: React.ReactNode;
  title: string;
  progress: number;
  total: number;
  onAction: () => void;
  actionText: string;
  disabled: boolean;
  loading?: boolean;
}> = ({ icon, title, progress, total, onAction, actionText, disabled, loading = false }) => (
  <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="text-2xl text-green-400 filter drop-shadow-lg">{icon}</div>
        <h3 className="font-semibold text-white text-lg">{title}</h3>
      </div>
      <span className="text-sm text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full">
        {progress}/{total}
      </span>
    </div>
    <ProgressBar current={progress} total={total} />
    <button
      onClick={onAction}
      disabled={disabled || loading}
      className="w-full mt-4 bg-gradient-to-r from-green-500/30 to-emerald-500/20 text-green-300 font-bold py-3 rounded-xl text-base hover:from-green-500/40 hover:to-emerald-500/30 hover:text-green-200 transition-all duration-300 disabled:bg-slate-700/30 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2 border border-green-500/20"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Processing...</span>
        </>
      ) : (
        <>
          <span className="text-lg">✨</span>
          <span>{actionText}</span>
        </>
      )}
    </button>
  </div>
);


const SpinWheelPage: React.FC<{ 
  user: User | null; 
  setUser: (user: User) => void 
}> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [recentPrize, setRecentPrize] = useState<{label: string; type: string; value: number} | null>(null);
  const [showPrizeNotification, setShowPrizeNotification] = useState<{label: string; type: string; value: number} | null>(null);

  const autoSpinActive = useRef(false);
  const currentSpins = useRef(user?.spins ?? 0);

  useEffect(() => {
    currentSpins.current = user?.spins ?? 0;
  }, [user?.spins]);

  const handleSpin = async (): Promise<boolean> => {
    if (isSpinning || currentSpins.current <= 0 || !user) return false;

    // *** MODIFICATION START: We will now set the rotation *before* setting isSpinning to true.
    let finalRotation = rotation;
    let prizeResult: { success: boolean; prize: any; user: User | null } | null = null;

    try {
      const result = await spinWheel(user.id);
      prizeResult = result; // Store result to use after animation

      let prizeIndex = -1;
      if (result.success && result.prize) {
        prizeIndex = SPIN_WHEEL_PRIZES.findIndex(p => p.label === result.prize!.label);
      }

      const numPrizes = SPIN_WHEEL_PRIZES.length;
      const segmentAngle = 360 / numPrizes;
      let stopAngle;

      if (prizeIndex !== -1) {
        const targetAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2);
        stopAngle = 270 - targetAngle;
      } else {
        stopAngle = Math.random() * 360;
      }

      const fullRotations = 5;
      // Calculate the final rotation value
      finalRotation = rotation + (fullRotations * 360) + stopAngle - (rotation % 360);

      // 1. Set the final rotation value
      setRotation(finalRotation);
      // 2. THEN, set isSpinning to true. This triggers the effect in the child component.
      setIsSpinning(true);
      // *** MODIFICATION END ***

      // Update user state immediately
      if (result.success && result.user) {
        setUser(result.user);
        currentSpins.current = result.user.spins;
        setRecentPrize(result.prize || null);
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          setIsSpinning(false); // This will "settle" the wheel
          if (prizeResult?.success && prizeResult.prize?.value > 0) {
            setShowPrizeNotification(prizeResult.prize);
          }
          resolve(prizeResult?.success ?? false);
        }, 4000); // Match the CSS transition duration
      });

    } catch (error) {
      console.error("An error occurred during the spin:", error);
      setIsSpinning(false);
      // If an error occurs, reset rotation to its previous state
      setRotation(rotation);
      return false;
    }
  };

  // ... (The rest of the component, including runAutoSpin, toggleAutoSpin, etc., remains the same)
  const runAutoSpin = async () => {
    if (!user) return;
    
    autoSpinActive.current = true;
    setIsAutoSpinning(true);

    let spinsInSession = 0;
    while (autoSpinActive.current && currentSpins.current > 0) {
      spinsInSession++;
      const success = await handleSpin();
      
      // Wait for spin animation to mostly finish before the next one
      await new Promise(resolve => setTimeout(resolve, success ? 4250 : 250));

      if (autoSpinActive.current && currentSpins.current > 0 && spinsInSession > 0 && spinsInSession % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          await show_9692552();
        } catch (e) {
          console.error("Ad failed during auto-spin", e);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    autoSpinActive.current = false;
    setIsAutoSpinning(false);
  };

  const toggleAutoSpin = () => {
    if (isAutoSpinning) {
      autoSpinActive.current = false;
      setIsAutoSpinning(false);
    } else {
      runAutoSpin();
    }
  };

  const handleWatchAd = async () => {
    if (!user) return;
    
    setAdLoading(true);
    try {
      await show_9692552();
      const result = await watchAdForSpin(user.id);
      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (e) {
      console.error("Ad failed:", e);
    } finally {
      setAdLoading(false);
    }
  };

  const handleCompleteTask = () => navigate('/');
  const handleInviteFriends = () => navigate('/friends');

  const userSpins = user?.spins ?? 0;
  const adsWatched = user?.ads_watched_today ?? 0;
  const tasksCompleted = user?.tasks_completed_today_for_spin ?? 0;
  const friendsInvited = user?.friends_invited_today_for_spin ?? 0;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="absolute w-1.5 h-1.5 bg-yellow-400/40 rounded-full animate-sparkle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 3}s` }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={i + 25} className="absolute w-3 h-3 bg-green-400/30 rounded-full animate-float" style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${4 + Math.random() * 4}s` }} />
        ))}
      </div>

      <BuySpinsModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} user={user} setUser={setUser} />
      <SpinHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} userId={user?.id} />
      <PrizeNotification prize={showPrizeNotification} onClose={() => setShowPrizeNotification(null)} />
      
      <header className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md z-40 p-5 border-b border-slate-700/30 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center font-semibold text-white/90 hover:text-white transition-colors w-28">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span className="ml-2">Back</span>
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">SPIN WHEEL</h1>
          {recentPrize && (
            <div className={`text-xs font-semibold mt-1 px-2 py-1 rounded-full ${ recentPrize.type === 'none' ? 'bg-red-500/20 text-red-300' : recentPrize.type === 'coins' ? 'bg-yellow-500/20 text-yellow-300' : recentPrize.type === 'spins' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300' }`}>
              Last: {recentPrize.label}
            </div>
           )}
        </div>
        
        <div className="w-28 text-right cursor-pointer hover:scale-105 transition-transform" onClick={() => setIsHistoryOpen(true)}>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 inline-block px-4 py-2 rounded-xl shadow-lg border border-slate-600/30">
            <span className="font-bold text-green-400 text-lg">{userSpins.toLocaleString()}</span>
            <span className="text-sm text-slate-300 ml-1">Spins</span>
          </div>
        </div>
      </header>
      
      <main className="pt-24 pb-12 px-5 flex flex-col items-center justify-center relative z-10">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-slate-700/30 shadow-2xl">
            <SpinWheel 
              rotation={rotation} 
              isSpinning={isSpinning || isAutoSpinning} 
              prizes={SPIN_WHEEL_PRIZES}
            />
            
            <div className="flex space-x-4 mt-6">
              <button onClick={() => handleSpin()} disabled={isSpinning || isAutoSpinning || userSpins <= 0} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/25 transform hover:scale-105 disabled:transform-none flex items-center justify-center space-x-3">
                {isSpinning ? (
                  <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span className="font-medium">SPINNING...</span></>
                ) : (
                  <><span className="text-xl">🎰</span><span className="font-medium">SPIN</span></>
                )}
              </button>
              
              <button onClick={toggleAutoSpin} disabled={isSpinning || userSpins <= 0} className={`flex-1 font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-300 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 disabled:transform-none flex items-center justify-center space-x-3 ${ isAutoSpinning ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 hover:shadow-red-500/25' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-blue-500/25' }`}>
                {isAutoSpinning ? (
                  <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span className="font-medium">STOP</span></>
                ) : (
                  <><span className="text-xl">⚡</span><span className="font-medium">AUTO</span></>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-center text-2xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">EARN MORE SPINS</h2>
            <EarnSpinOption icon={ICONS.ad} title="Watch an Ad" progress={adsWatched} total={50} onAction={handleWatchAd} actionText="Watch Ad (+1 Spin)" disabled={adsWatched >= 50} loading={adLoading} />
            <EarnSpinOption icon={ICONS.tasks} title="Complete Tasks" progress={tasksCompleted} total={50} onAction={handleCompleteTask} actionText="Go to Tasks (+1 Spin/task)" disabled={tasksCompleted >= 50} />
            <EarnSpinOption icon={ICONS.friends} title="Invite Friends" progress={friendsInvited} total={50} onAction={handleInviteFriends} actionText="Invite Friends (+1 Spin/invite)" disabled={friendsInvited >= 50} />
          </div>

          <div className="pt-2">
            <button onClick={() => setIsStoreOpen(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-5 rounded-2xl text-lg hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 shadow-xl hover:shadow-indigo-500/25 transform hover:scale-105 flex items-center justify-center space-x-3 group">
              <span className="text-xl group-hover:scale-110 transition-transform">🛒</span>
              <span className="font-medium">SPIN STORE</span>
              <span className="text-xl group-hover:scale-110 transition-transform">💎</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md z-40 p-4 border-t border-slate-700/30 text-center">
        <p className="text-slate-400 text-sm">Spin wisely! Each spin costs 1 spin token. Auto spin includes occasional ads.</p>
      </footer>
    </div>
  );
};

export default SpinWheelPage;
