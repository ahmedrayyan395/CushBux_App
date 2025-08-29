import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { ICONS, SPIN_WHEEL_PRIZES } from '../constants';
import SpinWheel from '../components/SpinWheel';
import BuySpinsModal from '../components/BuySpinsModal';
import { spinWheel, watchAdForSpin } from '../services/api';
import ProgressBar from '../components/ProgressBar';

declare const show_9692552: (type?: 'pop') => Promise<void>;

const EarnSpinOption: React.FC<{
    icon: React.ReactNode;
    title: string;
    progress: number;
    total: number;
    onAction: () => void;
    actionText: string;
    disabled: boolean;
}> = ({ icon, title, progress, total, onAction, actionText, disabled }) => (
    <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
                <div className="text-green-400">{icon}</div>
                <h3 className="font-semibold text-white">{title}</h3>
            </div>
            <span className="text-sm text-slate-400">{progress}/{total}</span>
        </div>
        <ProgressBar current={progress} total={total} />
        <button
            onClick={onAction}
            disabled={disabled}
            className="w-full mt-3 bg-green-500/20 text-green-400 font-bold py-2 rounded-lg text-sm hover:bg-green-500/40 transition-colors disabled:bg-slate-700/50 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
            {actionText}
        </button>
    </div>
);


const SpinWheelPage: React.FC<{ user: User | null; setUser: (user: User | ((prev: User | null) => User | null)) => void }> = ({ user, setUser }) => {
  const navigate = useNavigate();

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  const autoSpinActive = useRef(false);
  const currentSpins = useRef(user?.spins ?? 0);

  useEffect(() => {
    currentSpins.current = user?.spins ?? 0;
  }, [user?.spins]);

  const handleSpin = async () => {
    if (isSpinning || currentSpins.current <= 0) return false;

    setIsSpinning(true);
    const result = await spinWheel();
    
    if (result.success) {
        setUser(result.user);
        currentSpins.current = result.user.spins;
    }
    
    let stopAngle = 0;
    if (result.success) {
        const prizeIndex = SPIN_WHEEL_PRIZES.findIndex(p => 
            p.label === result.prize.label // Use label for uniqueness in case of same values
        );

        if (prizeIndex !== -1) {
            const numPrizes = SPIN_WHEEL_PRIZES.length;
            const segmentAngle = 360 / numPrizes;
            
            // Calculate the angle for the middle of the target segment
            const targetAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2);
            
            // CRITICAL FIX: The wheel's 0-degree point is at 3 o'clock.
            // The pointer is at 12 o'clock (270 degrees).
            // To align the targetAngle with the pointer, we calculate the required rotation.
            // rotation + targetAngle = 270 => rotation = 270 - targetAngle
            stopAngle = 270 - targetAngle;

        } else {
            // Fallback for an unexpected prize
            stopAngle = Math.random() * 360;
        }
    } else {
        // If the spin fails (e.g. no spins left), just do a random spin animation.
        stopAngle = Math.random() * 360;
    }
    
    setRotation(prevRotation => {
        // Normalize previous rotation to avoid excessive numbers
        const normalizedRotation = prevRotation % 360;
        // Add multiple full rotations for visual effect + the final stop angle
        return normalizedRotation + (360 * 5) + (360 - (normalizedRotation - stopAngle));
    });

    return new Promise<boolean>((resolve) => {
        setTimeout(() => {
            setIsSpinning(false);
            if (!result.success) {
                alert(result.prize.label); // Alert only on error
            }
            resolve(result.success);
        }, 4000); // Must match animation duration in SpinWheel.tsx
    });
  };
  
  const runAutoSpin = async () => {
    autoSpinActive.current = true;
    setIsAutoSpinning(true);

    let spinsInSession = 0;
    while (autoSpinActive.current && currentSpins.current > 0) {
      spinsInSession++;
      await handleSpin();
      
      await new Promise(resolve => setTimeout(resolve, 250));

      if (autoSpinActive.current && currentSpins.current > 0 && spinsInSession > 0 && spinsInSession % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await show_9692552();
          } catch (e) {
            console.error("Ad failed during auto-spin, continuing...", e);
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
      try {
        await show_9692552();
        const result = await watchAdForSpin();
        if(result.success && result.user) {
            setUser(result.user);
            alert(result.message);
        } else {
            alert(result.message);
        }
      } catch (e) {
          console.error("Ad failed or was closed:", e);
          alert("Ad failed to load.");
      }
  };

  const userSpins = user?.spins ?? 0;

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <BuySpinsModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} user={user} setUser={setUser} />
      
      <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm z-40 p-4 border-b border-slate-700/50 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center font-semibold text-white w-24">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back
        </button>
        <h1 className="text-lg font-bold">Spin Wheel</h1>
        <div className="w-24 text-right">
            <div className="bg-slate-800 inline-block px-3 py-1 rounded-lg">
                <span className="font-bold text-green-400">{userSpins.toLocaleString()}</span>
                <span className="text-sm text-slate-300"> Spins</span>
            </div>
        </div>
      </header>
      
      <main className="pt-20 pb-10 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto space-y-6">
            <SpinWheel 
              rotation={rotation} 
              isSpinning={isSpinning || isAutoSpinning} 
              prizes={SPIN_WHEEL_PRIZES}
            />
            
            <div className="flex space-x-3">
                <button
                    onClick={() => handleSpin()}
                    disabled={isSpinning || isAutoSpinning || userSpins <= 0}
                    className="flex-1 bg-green-500 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-green-600 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    SPIN
                </button>
                 <button
                    onClick={toggleAutoSpin}
                    disabled={isSpinning || userSpins <= 0}
                    className={`flex-1 font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed ${isAutoSpinning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                    {isAutoSpinning ? 'STOP' : 'AUTO SPIN'}
                </button>
            </div>

            <div className="space-y-4 pt-4">
                <h2 className="text-center text-xl font-bold text-white">Get More Spins</h2>
                <EarnSpinOption
                    icon={ICONS.ad}
                    title="Watch an ad"
                    progress={user?.adsWatchedToday ?? 0}
                    total={50}
                    onAction={handleWatchAd}
                    actionText="Watch Ad (+1 Spin)"
                    disabled={(user?.adsWatchedToday ?? 50) >= 50}
                />
                 <EarnSpinOption
                    icon={ICONS.tasks}
                    title="Complete tasks"
                    progress={user?.tasksCompletedTodayForSpin ?? 0}
                    total={50}
                    onAction={() => navigate('/')}
                    actionText="Go to Tasks (+1 Spin / task)"
                    disabled={(user?.tasksCompletedTodayForSpin ?? 50) >= 50}
                />
                 <EarnSpinOption
                    icon={ICONS.friends}
                    title="Invite friends"
                    progress={user?.friendsInvitedTodayForSpin ?? 0}
                    total={50}
                    onAction={() => navigate('/friends')}
                    actionText="Invite Friends (+1 Spin / invite)"
                    disabled={(user?.friendsInvitedTodayForSpin ?? 50) >= 50}
                />
            </div>

            <div className="pt-4">
                <button 
                    onClick={() => setIsStoreOpen(true)}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-lg text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2z"/></svg>
                    <span>Spin Store</span>
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default SpinWheelPage;
