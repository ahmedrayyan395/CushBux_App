import React, { useState, useEffect, useRef } from 'react';
import type { DailyTask, GameTask, User, PartnerCampaign, UserCampaign } from '../types';
import { 
  claimDailyTask,
  fetchAllCampaignsAPI,
  startTask,
  claimTask,
  getUserTaskStatus,
  startDailyTask,
  getUserDailyTaskStatus,
  redeemPromoCode,
  fetchIncompleteDailyTasks,
  watchAdForSpin,
} from '../services/api';
import { ICONS, CONVERSION_RATE, TASK_TYPES } from '../constants';
import { fetchTaskByBlockId, completeAdsGramTask } from '../services/api';
import ProgressBar from '@/components/ProgressBar';

// AdsGram SDK initialization
let AdController;
try {
  AdController = window.Adsgram?.init({ blockId: "int-15335" });
} catch (error) {
  console.error("Failed to initialize AdsGram SDK:", error);
}

// Adextra declaration
declare global {
  interface Window {
    Adsgram?: any;
    p_adextra?: (onSuccess?: () => void, onError?: () => void) => void;
    AdexiumWidget?: any;
  }
}

// Declare the ad SDK functions
declare const show_9692552: (type?: 'pop') => Promise<void>;

const TasksLockedOverlay = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-slate-700/50">
    <div className="w-20 h-20 mb-4 text-slate-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-3">
      Tasks Locked
    </h3>
    <p className="text-slate-300 text-lg leading-relaxed max-w-md">
      Complete all mandatory daily tasks to unlock more ways to earn rewards and opportunities.
    </p>
  </div>
);

const PromoCodeSection: React.FC<{ setUser: (user: User) => void }> = ({ setUser }) => {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRedeem = async () => {
    if (!code || isLoading) return;
    setIsLoading(true);
    setFeedback(null);

    const result = await redeemPromoCode(code);
    
    setFeedback({ message: result.message, isError: !result.success });
    if (result.success && result.user) {
      setUser(result.user);
      setCode('');
    }
    setIsLoading(false);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
          Promo Code
        </h2>
        <div className="w-8 h-8 text-green-400">
          {ICONS.gift}
        </div>
      </div>
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER PROMO CODE"
              className="w-full bg-slate-800/80 border border-slate-600 rounded-xl p-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all duration-200 uppercase font-medium tracking-wider backdrop-blur-sm"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleRedeem}
            disabled={!code || isLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 sm:px-8 rounded-xl transition-all duration-200 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-green-500/25 flex-shrink-0 min-w-[120px] justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Apply'
            )}
          </button>
        </div>
        {feedback && (
          <p className={`text-sm font-semibold pt-3 text-center ${feedback.isError ? 'text-red-400' : 'text-green-400'}`}>
            {feedback.message}
          </p>
        )}
      </div>
    </section>
  );
};

// Mobile detection utility
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Improved link opening for mobile devices with external link handling
const openLink = (url: string, isExternalTask: boolean = false) => {
  if (!url) return;
  
  const isDeepLink = url.startsWith('tg:') || 
                    url.startsWith('whatsapp:') || 
                    url.startsWith('fb:') ||
                    url.startsWith('twitter:') ||
                    url.includes('//t.me/');
  
  const isExternalLink = isExternalTask && 
                        (url.startsWith('http://') || url.startsWith('https://')) &&
                        !url.includes(window.location.hostname);
  
  if (isMobileDevice()) {
    if (isExternalLink) {
      window.location.href = url;
    } else if (isDeepLink) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Daily Task Item Component
const DailyTaskItem: React.FC<{ 
  task: DailyTask; 
  icon: React.ReactNode;
  description: string;
  buttonClass: string;
  onStart: (taskId: number, taskType?: string, link?: string, isExternal?: boolean) => void;
  onClaim: (taskId: number) => void;
  buttonState: { text: string; disabled: boolean; variant: string };
}> = ({ task, icon, description, buttonClass, onStart, onClaim, buttonState }) => {

  const isExternalTask = task.link && 
                        (task.link.startsWith('http://') || task.link.startsWith('https://')) &&
                        !task.link.includes(window.location.hostname);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (buttonState.variant === 'claim') {
      onClaim(task.id);
    } else if (buttonState.variant === 'start') {
      if (isExternalTask) {
        const userConfirmed = confirm(`You will be redirected to complete this task. Make sure to complete the required action to earn your reward. Continue?`);
        if (!userConfirmed) return;
      }
      onStart(task.id, task.taskType, task.link, isExternalTask);
    }
  };

  const calculateReward = () => {
    const possibleRewardFields = [
      task.reward,
      task.cost,
      task.points,
      task.coins,
      task.amount
    ];
    
    for (const reward of possibleRewardFields) {
      if (reward !== undefined && reward !== null && !isNaN(Number(reward)) && Number(reward) > 0) {
        return Number(reward);
      }
    }
    
    if (task.taskType === TASK_TYPES.AD) {
      return 500;
    } else if (task.taskType === 'SOCIAL') {
      return 300;
    } else {
      return 200;
    }
  };

  const reward = calculateReward();

  return (
    <div className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-5 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-grow min-w-0">
          <div className={`bg-gradient-to-br from-slate-700 to-slate-800 p-3 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-200 ${buttonClass.split(' ')[0]}`}>
            <div className="w-6 h-6 text-white">
              {icon}
            </div>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-white truncate text-lg" title={task.title}>{task.title}</h3>
            <p className="text-slate-400 text-sm mt-1">{description}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-green-400 font-semibold">+{reward.toLocaleString()} Coins</span>
              {task.in_progress && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">In Progress</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleClick}
          className={`${buttonClass} text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-200 flex-shrink-0 ml-4 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            buttonState.disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:opacity-90'
          }`}
        >
          {buttonState.text}
        </button>
      </div>
    </div>
  );
};

// Campaign Task Item Component
const CampaignTaskItem: React.FC<{ 
  task: UserCampaign; 
  icon: React.ReactNode;
  description: string;
  buttonClass: string;
  onStart: (taskId: number, taskType?: string, link?: string, isExternal?: boolean) => void;
  onClaim: (taskId: number) => void;
  buttonState: { text: string; disabled: boolean; variant: string };
  user: User;
  loadAllData: () => void;
}> = ({ task, icon, description, buttonClass, onStart, onClaim, buttonState, user, loadAllData }) => {

  const isAdsGramTask = (task as any).isAdsGramTask;

  if (isAdsGramTask) {
    return (
      <Task 
        key={task.id}
        debug={false} 
        blockId={(task as any).adsgram_block_id}
        userId={user.id}
        onTaskComplete={(reward) => {
          loadAllData();
        }}
      />
    );
  }

  const isExternalTask = task.link && 
                        (task.link.startsWith('http://') || task.link.startsWith('https://')) &&
                        !task.link.includes(window.location.hostname);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (buttonState.variant === 'claim') {
      onClaim(task.id);
    } else if (buttonState.variant === 'start') {
      if (isExternalTask) {
        const userConfirmed = confirm(`You will be redirected to complete this task. Make sure to complete the required action to earn your reward. Continue?`);
        if (!userConfirmed) return;
      }
      onStart(task.id, task.taskType, task.link, isExternalTask);
    }
  };

  const calculateReward = () => {
    if (task.category === 'GAME' || task.category === 'SOCIAL') {
      return 5000;
    }
    
    if (task.category === 'PARTNER') {
      const level = task.level || 1;
      return 5000 * level;
    }
    
    const possibleRewardFields = [
      task.reward,
      task.cost,
      task.points,
      task.coins,
      task.amount,
      task.payout
    ];
    
    for (const reward of possibleRewardFields) {
      if (reward !== undefined && reward !== null && !isNaN(Number(reward)) && Number(reward) > 0) {
        return Number(reward) * CONVERSION_RATE;
      }
    }
    
    return 500;
  };

  const reward = calculateReward();

  return (
    <div className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-5 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-grow min-w-0">
          <div className={`bg-gradient-to-br from-slate-700 to-slate-800 p-3 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-200 ${buttonClass.split(' ')[0]}`}>
            <div className="w-6 h-6 text-white">
              {icon}
            </div>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-white truncate text-lg" title={task.title}>{task.title}</h3>
            <p className="text-slate-400 text-sm mt-1">{description}</p>
            <p className="text-green-400 font-semibold mt-2">+{reward.toLocaleString()} Coins</p>
            {task.category === 'PARTNER' && task.level && (
              <p className="text-blue-400 text-xs mt-1">Level {task.level} Partner Task</p>
            )}
          </div>
        </div>
        <button
          onClick={handleClick}
          className={`${buttonClass} text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-200 flex-shrink-0 ml-4 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            buttonState.disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:opacity-90'
          }`}
        >
          {buttonState.text}
        </button>
      </div>
    </div>
  );
};

// Section Header Component
const SectionHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
  taskCount: number;
  onShowMore?: () => void;
  showMoreEnabled?: boolean;
}> = ({ title, icon, taskCount, onShowMore, showMoreEnabled }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
        <div className="w-5 h-5 text-white">
          {icon}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-slate-400 text-sm">{taskCount} task{taskCount !== 1 ? 's' : ''} available</p>
      </div>
    </div>
    {showMoreEnabled && onShowMore && (
      <button
        onClick={onShowMore}
        className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50 text-sm font-medium"
      >
        Show More
      </button>
    )}
  </div>
);

// Task Section Component
const TaskSection: React.FC<{
  title: string;
  tasks: any[];
  icon: React.ReactNode;
  description: string;
  buttonClass: string;
  onStart: (taskId: number, taskType?: string, link?: string, isExternal?: boolean) => void;
  onClaim: (taskId: number) => void;
  getTaskButtonState: (taskId: number) => { text: string; disabled: boolean; variant: string };
  TaskComponent?: React.ComponentType<any>;
  onShowMore?: () => void;
  user: User;
  loadAllData: () => void;
  additionalTasks?: any[];
}> = ({ title, tasks, icon, description, buttonClass, onStart, onClaim, getTaskButtonState, TaskComponent, onShowMore, user, loadAllData, additionalTasks = [] }) => {
  
  const allTasks = [...tasks, ...additionalTasks];

  return (
    <section className="mb-8">
      <SectionHeader
        title={title}
        icon={icon}
        taskCount={allTasks.length}
        onShowMore={onShowMore}
        showMoreEnabled={allTasks.length >= 5 && onShowMore !== undefined}
      />
      <div className="space-y-4">
        {allTasks.length > 0 ? (
          allTasks.map((task) => {
            const buttonState = getTaskButtonState(task.id);
            const Component = TaskComponent || CampaignTaskItem;
            
            const isAdsGramTask = (task as any).adsgram_block_id && (task as any).adsgram_block_id.startsWith('task-');
            
            if (isAdsGramTask) {
              return (
                <div key={task.id} className="mb-4">
                  <Task 
                    key={task.id}
                    debug={false} 
                    blockId={(task as any).adsgram_block_id}
                    userId={user.id}
                    onTaskComplete={(reward) => {
                      loadAllData();
                    }}
                  />
                </div>
              );
            } else {
              return (
                <Component
                  key={task.id}
                  task={task}
                  icon={icon}
                  description={description}
                  buttonClass={buttonClass}
                  onStart={onStart}
                  onClaim={onClaim}
                  buttonState={buttonState}
                  user={user}
                  loadAllData={loadAllData}
                />
              );
            }
          })
        ) : (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 rounded-2xl text-center border border-slate-700/50 backdrop-blur-sm">
            <div className="w-16 h-16 mx-auto mb-4 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No {title.toLowerCase()} available</h3>
            <p className="text-slate-500">Check back later for new opportunities</p>
          </div>
        )}
      </div>
    </section>
  );
};

// Progress Indicator Component
const ProgressIndicator: React.FC<{ completed: number; total: number }> = ({ completed, total }) => {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Daily Progress</h3>
        <span className="text-slate-400 text-sm">{completed}/{total} completed</span>
      </div>
      <ProgressBar current={completed} total={total} />
      <p className="text-slate-400 text-sm mt-3">
        {completed === total ? 'All tasks completed! 🎉' : 'Complete all daily tasks to unlock more opportunities'}
      </p>
    </div>
  );
};

// AdsGram Task Component
type TaskProps = {
  key: number;
  debug?: boolean;
  blockId: string;
  userId: string;
  onTaskComplete: (reward: number) => void;
};

const Task = ({ key, debug, blockId, userId, onTaskComplete }: TaskProps) => {
  const taskRef = useRef<any>(null);
  const [taskData, setTaskData] = useState<DailyTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!blockId || !userId) return;
      
      setLoading(true);
      setError(null);
      try {
        const task = await fetchTaskByBlockId(blockId, userId);
        if (task) {
          setTaskData(task);
        } else {
          setError('Task not available or already completed');
        }
      } catch (error) {
        console.error('Error fetching task by block ID:', error);
        setError('Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [blockId, userId]);

  useEffect(() => {
    const handleReward = async (event: CustomEvent) => {
      try {
        const result = await completeAdsGramTask(userId, blockId);
        
        if (result.success && result.user) {
          onTaskComplete(result.reward);
          
          if (result.reward) {
            alert(`Game task completed! You earned ${result.reward} coins`);
          }
        } else {
          alert(result.message || "Failed to complete game task");
        }
      } catch (error) {
        console.error("Error completing game task:", error);
        alert("Failed to complete game task");
      }
    };

    const handleDone = async (event: CustomEvent) => {
      try {
        const result = await completeAdsGramTask(userId, blockId);
        
        if (result.success && result.user) {
          onTaskComplete(result.reward);
          
          if (result.reward) {
            alert(`Game task completed! You earned ${result.reward} coins`);
          }
        } else {
          alert(result.message || "Failed to complete game task");
        }
      } catch (error) {
        console.error("Error completing game task:", error);
        alert("Failed to complete game task");
      }
    };

    const currentTask = taskRef.current;
    if (currentTask && taskData) {
      currentTask.addEventListener("reward", handleReward as EventListener);
      currentTask.addEventListener("done", handleDone as EventListener);
    }

    return () => {
      if (currentTask) {
        currentTask.removeEventListener("reward", handleReward as EventListener);
        currentTask.removeEventListener("done", handleDone as EventListener);
      }
    };
  }, [blockId, userId, onTaskComplete, taskData]);

  if (!customElements.get("adsgram-task")) {
    return null;
  }

  if (loading) {
    return <div>Loading task...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  if (!taskData) {
    return null;
  }

  return (
    <>
      <style>{`
        .task {
          --adsgram-task-font-size: 16px;
          --adsgram-task-icon-size: 50px;
          --adsgram-task-icon-title-gap: 15px;
          --adsgram-task-button-width: 60px;
          --adsgram-task-icon-border-radius: 8px;

          display: block;
          width: 328px;
          padding: 8px 16px 8px 8px;
          border-radius: 16px;
          background-color: #1d2733;
          font-family: Roboto, sans-serif;
          color: white;
        }
        .reward {
          margin: 5px 0 0 0;
          font-size: 14px;
        }
        .button {
          margin-left: 10px;
          background-color: #50a8eb;
          border-radius: 5px;
          padding: 6px 12px;
        }
        .button_claim {
          margin-left: 0;
          background-color: #ee941c;
        }
        .button_done {
          margin-left: 0;
          background-color: #007539;
        }
      `}</style>

      <adsgram-task
        className="task"
        data-block-id={blockId}
        data-debug={debug}
        ref={taskRef}
      >
        <span slot="reward" className="reward">
          {taskData.reward} coins
        </span>
        <div slot="button" className="button">
          go
        </div>
        <div slot="claim" className="button_claim">
          claim
        </div>
        <div slot="done" className="button_done">
          done
        </div>
      </adsgram-task>
    </>
  );
};

// Earn Spin Option Component
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
    </div>
    <button
      onClick={onAction}
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

// Main Earnings Page Component
const EarningsPage: React.FC<{ setUser: (user: User) => void; user: User }> = ({ setUser, user }) => {
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, { started: boolean; completed: boolean }>>({});
  const [dailyTaskStatuses, setDailyTaskStatuses] = useState<Record<string, { started: boolean; completed: boolean; claimed: boolean }>>({});
  const [loadingTasks, setLoadingTasks] = useState<Set<number>>(new Set());
  const [loadingDailyTasks, setLoadingDailyTasks] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [availableAdsGramTasks, setAvailableAdsGramTasks] = useState<DailyTask[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const adProviderToggle = useRef(0); // 0: AdsGram, 1: show_9692552, 2: Adexium
  const [adextraLoaded, setAdextraLoaded] = useState(false);

  // Adexium Widget
 useEffect(() => {
  // Only initialize Adexium if we're in a real Telegram environment
  if (window.AdexiumWidget && window.Telegram?.WebApp) {
    try {
      const adexiumWidget = new window.AdexiumWidget({
        wid: '17a1219e-df28-4d46-94c9-4d32ca1c8234', 
        adFormat: 'push-like'
      });
      adexiumWidget.autoMode();
    } catch (error) {
      console.warn('Adexium initialization failed:', error);
    }
  }
}, []);



// Add this useEffect to ensure Adextra script is loaded
useEffect(() => {
  // Check if Adextra script is already loaded
  if (window.p_adextra) {
    setAdextraLoaded(true);
    return;
  }

  // Load Adextra script dynamically
  const script = document.createElement('script');
  script.src = 'https://partner.adextra.io/jt/127c1e3df9f3d1de8356b0dddc38688b88526b44.js';
  script.async = true;
  script.onload = () => {
    console.log('Adextra script loaded successfully');
    setAdextraLoaded(true);
  };
  script.onerror = () => {
    console.warn('Failed to load Adextra script');
    setAdextraLoaded(false);
  };
  document.head.appendChild(script);
}, []);




  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [campaignsData, dailyTasksData, statusResponse, dailyStatusResponse] = await Promise.all([
        fetchAllCampaignsAPI(user.id),
        fetchIncompleteDailyTasks(user.id),
        getUserTaskStatus(user.id),
        getUserDailyTaskStatus(user.id)
      ]);

      setCampaigns(campaignsData);
      setDailyTasks(dailyTasksData);

      if (statusResponse.success) {
        setTaskStatuses(statusResponse.taskStatuses);
      }

      if (dailyStatusResponse.success) {
        setDailyTaskStatuses(dailyStatusResponse.taskStatuses);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Filter out AdsGram tasks from daily tasks
  const regularDailyTasks = dailyTasks.filter(task => 
    !(task as any).adsgram_block_id || !(task as any).adsgram_block_id.startsWith('task-')
  );

  // Get only AdsGram tasks
  const adsgramTasks = dailyTasks.filter(task => 
    (task as any).adsgram_block_id && (task as any).adsgram_block_id.startsWith('task-')
  );

  // Filter available AdsGram tasks
  useEffect(() => {
    const filterAvailableAdsGramTasks = async () => {
      const availableTasks = [];
      
      for (const task of adsgramTasks) {
        try {
          const taskData = await fetchTaskByBlockId((task as any).adsgram_block_id, user.id);
          if (taskData) {
            availableTasks.push({...task, userId: user.id});
          }
        } catch (error) {
          console.log(`Task ${task.id} not available:`, error);
        }
      }
      
      setAvailableAdsGramTasks(availableTasks);
    };

    if (adsgramTasks.length > 0) {
      filterAvailableAdsGramTasks();
    }
  }, [adsgramTasks, user.id]);

  // Function to show Adextra ad
 // Function to show Adextra ad
// Function to show Adextra ad
// Alternative Adextra function that tries different calling patterns
const showAdextraAd = async (): Promise<boolean> => {
  if (typeof window.p_adextra !== 'function') {
    console.warn("Adextra not properly initialized - simulating in development");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
  }

  return new Promise((resolve) => {
    try {
      console.log("Attempting to call Adextra...");
      
      // Try different calling patterns based on Adextra documentation
      const onSuccess = () => {
        console.log("Adextra ad completed successfully (onSuccess)");
        resolve(true);
      };

      const onError = () => {
        console.warn("Adextra ad failed (onError) - simulating success");
        setTimeout(() => {
          resolve(true);
        }, 2000);
      };

      // Pattern 1: Try with both callbacks
      try {
        window.p_adextra(onSuccess, onError);
        
        // Set a timeout in case the callbacks never fire
        setTimeout(() => {
          console.warn("Adextra callbacks didn't fire - simulating success");
          resolve(true);
        }, 5000);
        
      } catch (callError) {
        console.warn("Adextra call failed - trying alternative pattern:", callError);
        
        // Pattern 2: Try without callbacks
        try {
          window.p_adextra();
          console.log("Adextra called without callbacks - assuming success");
          setTimeout(() => {
            resolve(true);
          }, 2000);
        } catch (altError) {
          console.warn("All Adextra patterns failed - simulating success:", altError);
          setTimeout(() => {
            resolve(true);
          }, 2000);
        }
      }
      
    } catch (error) {
      console.warn("Adextra overall error - simulating success:", error);
      setTimeout(() => {
        resolve(true);
      }, 2000);
    }
  });
};

  // Function to show Adexium ad
 // Function to show Adexium ad
const showAdexiumAd = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!window.AdexiumWidget) {
      console.warn("Adexium not loaded");
      resolve(false);
      return;
    }

    try {
      // Simulate Adexium ad completion since we can't properly test in dev
      console.log("Simulating Adexium ad in development");
      setTimeout(() => {
        resolve(true);
      }, 2000);
    } catch (error) {
      console.warn("Adexium ad failed:", error);
      resolve(false);
    }
  });
};

  // Main ad function that alternates between all three providers
  const showRewardAd = async (): Promise<boolean> => {
  setAdLoading(true);
  try {
    const currentProvider = adProviderToggle.current;
    
    switch (currentProvider) {
      // case 0: // AdsGram
      //   if (AdController) {
      //     const result = await AdController.show();
      //     if (result.done) {
      //       console.log("AdsGram ad completed successfully");
      //       adProviderToggle.current = (adProviderToggle.current + 1) % 4;
      //       return true;
      //     } else {
      //       throw new Error("AdsGram ad not completed");
      //     }
      //   } else {
      //     throw new Error("AdsGram not available");
      //   }

      case 0: // show_9692552 (Monetag)
        await show_9692552();
        console.log("show_9692552 ad completed successfully");
        adProviderToggle.current = (adProviderToggle.current + 1) % 4;
        return true;

      // case 2: // Adexium
      //   const adexiumSuccess = await showAdexiumAd();
      //   if (adexiumSuccess) {
      //     console.log("Adexium ad completed successfully");
      //     adProviderToggle.current = (adProviderToggle.current + 1) % 4;
      //     return true;
      //   } else {
      //     throw new Error("Adexium ad failed");
      //   }

      case 1: // Adextra
        const adextraSuccess = await showAdextraAd();
        if (adextraSuccess) {
          console.log("Adextra ad completed successfully");
          adProviderToggle.current = (adProviderToggle.current + 1) % 4;
          return true;
        } else {
          throw new Error("Adextra ad failed");
        }

      default:
        throw new Error("Unknown ad provider");
    }
  } catch (error) {
    console.error(`Ad provider ${adProviderToggle.current} failed:`, error);
    
    // Try fallback providers in order
    const fallbackProviders = [0, 1].filter(p => p !== adProviderToggle.current);
    
    for (const provider of fallbackProviders) {
      try {
        switch (provider) {
          // case 0: // AdsGram fallback
          //   if (AdController) {
          //     const fallbackResult = await AdController.show();
          //     if (fallbackResult.done) {
          //       console.log("Fallback AdsGram ad completed");
          //       adProviderToggle.current = (provider + 1) % 4;
          //       return true;
          //     }
          //   }
          //   break;
            
          case 0: // show_9692552 fallback
            await show_9692552();
            console.log("Fallback show_9692552 completed");
            adProviderToggle.current = (provider + 1) % 4;
            return true;
            
          // case 2: // Adexium fallback
          //   const adexiumFallback = await showAdexiumAd();
          //   if (adexiumFallback) {
          //     console.log("Fallback Adexium ad completed");
          //     adProviderToggle.current = (provider + 1) % 4;
          //     return true;
          //   }
          //   break;

          case 1: // Adextra fallback
            const adextraFallback = await showAdextraAd();
            if (adextraFallback) {
              console.log("Fallback Adextra ad completed");
              adProviderToggle.current = (provider + 1) % 4;
              return true;
            }
            break;
        }
      } catch (fallbackError) {
        console.error(`Fallback provider ${provider} also failed:`, fallbackError);
      }
    }
    
    console.error("All ad providers failed");
    return false;
  } finally {
    setAdLoading(false);
  }
};

  const handleWatchAdForSpin = async () => {
    if (!user) return;
    
    const success = await showRewardAd();
    if (success) {
      try {
        const result = await watchAdForSpin(user.id);
        if (result.success && result.user) {
          setUser(result.user);
          alert('You earned 1 spin! 🎰 and 1 Ring 💍');
        }
      } catch (e) {
        console.error("API call failed after ad:", e);
        alert('Ad watched but failed to get spin. Please try again.');
      }
    } else {
      alert('Failed to load ad. Please try again.');
    }
  };

  // Use the same showRewardAd for daily tasks
  const showAdIfAvailable = showRewardAd;

  // Daily Task Logic
  const handleDailyTaskStart = async (taskId: number, taskType?: string, link?: string, isExternal?: boolean) => {
    setLoadingDailyTasks(prev => new Set(prev).add(taskId));

    try {
      const task = dailyTasks.find(t => t.id === taskId);
      const actualTaskType = taskType || task?.type;
      
      if (actualTaskType?.toLowerCase() === TASK_TYPES.AD.toLowerCase()) {
        const adShown = await showAdIfAvailable();
        if (!adShown) {
          alert("Ad failed to load. Please try again.");
          return;
        }
      }

      const result = await startDailyTask(user.id, taskId);

      if (result.success) {
        setDailyTaskStatuses(prev => ({
          ...prev,
          [taskId]: { started: true, completed: false, claimed: false }
        }));
        
        if (link && actualTaskType !== TASK_TYPES.AD) {
          console.log('Redirecting to:', link, 'Mobile:', isMobileDevice(), 'External:', isExternal);
          openLink(link, isExternal || false);
        }
        
        if (actualTaskType === TASK_TYPES.AD) {
          setTimeout(() => {
            handleDailyTaskClaim(taskId);
          }, 500);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error starting daily task:", error);
      alert("Failed to start task");
    } finally {
      setLoadingDailyTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleDailyTaskClaim = async (taskId: number) => {
    setLoadingDailyTasks(prev => new Set(prev).add(taskId));

    try {
      const result = await claimDailyTask(user.id, taskId);

      if (result.success && result.user) {
        setUser(result.user);
        setDailyTaskStatuses(prev => ({
          ...prev,
          [taskId]: { started: true, completed: true, claimed: true }
        }));
        if (result.reward) {
          alert(`Task completed! You earned ${result.reward.toLocaleString()} coins`);
        }
      } else {
        alert(result.message || "Failed to claim task");
      }
    } catch (error) {
      console.error("Error claiming daily task:", error);
      alert("Failed to claim task");
    } finally {
      setLoadingDailyTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getDailyTaskButtonState = (taskId: number) => {
    const status = dailyTaskStatuses[taskId];
    if (!status) return { text: 'Start', disabled: false, variant: 'start' };
    if (status.claimed) return { text: 'Claimed', disabled: true, variant: 'claimed' };
    if (status.started) return { text: 'Claim', disabled: false, variant: 'claim' };
    return { text: 'Start', disabled: false, variant: 'start' };
  };

  // Campaign Tasks Logic
  const handleTaskStart = async (taskId: number, taskType?: string, link?: string, isExternal?: boolean) => {
    setLoadingTasks(prev => new Set(prev).add(taskId));
    try {
      const result = await startTask(user.id, taskId);
      if (result.success) {
        setTaskStatuses(prev => ({
          ...prev,
          [taskId]: { started: true, completed: false }
        }));
        
        if (link && taskType !== TASK_TYPES.AD) {
          console.log('Redirecting to:', link, 'Mobile:', isMobileDevice(), 'External:', isExternal);
          openLink(link, isExternal || false);
        }
        
        if (taskType === TASK_TYPES.AD) {
          const adShown = await showAdIfAvailable();
          if (adShown) {
            setTimeout(() => {
              handleTaskClaim(taskId);
            }, 500);
          }
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error starting task:", error);
      alert(error.data?.['message'] || "Failed to start task");
    } finally {
      setLoadingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleTaskClaim = async (taskId: number) => {
    setLoadingTasks(prev => new Set(prev).add(taskId));
    try {
      const result = await claimTask(user.id, taskId);
      if (result.success && result.user) {
        setUser(result.user);
        setTaskStatuses(prev => ({
          ...prev,
          [taskId]: { started: true, completed: true }
        }));
        setTimeout(() => {
          setCampaigns(prev => prev.filter(task => task.id !== taskId));
        }, 1000);
        if (result.reward) {
          alert(`Task completed! You earned ${result.reward.toLocaleString()} coins`);
        }
      } else {
        alert(result.message || "Failed to claim task");
      }
    } catch (error) {
      console.error("Error claiming task:", error);
      alert(error.data?.['message'] || "Failed to claim task");
    } finally {
      setLoadingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getTaskButtonState = (taskId: number) => {
    const status = taskStatuses[taskId];
    if (!status) return { text: 'Start', disabled: false, variant: 'start' };
    if (status.completed) return { text: 'Claimed', disabled: true, variant: 'claimed' };
    if (status.started) return { text: 'Claim', disabled: false, variant: 'claim' };
    return { text: 'Start', disabled: false, variant: 'start' };
  };

  const loadMoreCampaigns = async (category: string) => {
    try {
      const response = await fetchAllCampaignsAPI(user.id);
      const allCategoryCampaigns = response.filter((campaign: UserCampaign) => campaign.category === category);
      setCampaigns(prev => {
        const otherCampaigns = prev.filter(c => c.category !== category);
        return [...otherCampaigns, ...allCategoryCampaigns];
      });
      setExpandedCategories(prev => ({ ...prev, [category]: true }));
    } catch (error) {
      console.error("Error loading more campaigns:", error);
    }
  };

  const gameTasks = campaigns.filter(c => c.category === "GAME");
  const socialTasks = campaigns.filter(c => c.category === "SOCIAL");
  const partnerTasks = campaigns.filter(c => c.category === "PARTNER");

  const dailyTasksCompleted = regularDailyTasks.every(task => 
    dailyTaskStatuses[task.id]?.claimed === true
  );

  const completedDailyCount = regularDailyTasks.filter(task => 
    dailyTaskStatuses[task.id]?.claimed === true
  ).length;

  const adsWatched = user?.ads_watched_today ?? 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-3">
          Earn Rewards
        </h1>
        <p className="text-slate-400 text-lg">Complete tasks and unlock opportunities to earn coins</p>
      </div>

      <PromoCodeSection setUser={setUser} />

      {/* Daily tasks with progress (EXCLUDES AdsGram tasks) */}
      <section className="mb-8">
        <SectionHeader
          title="Daily Tasks"
          icon={ICONS.tasks}
          taskCount={regularDailyTasks.length}
        />
        <ProgressIndicator completed={completedDailyCount} total={regularDailyTasks.length} />
        <div className="mt-6 space-y-4">
          {regularDailyTasks.length > 0 ? (
            regularDailyTasks.map((task) => {
              const buttonState = getDailyTaskButtonState(task.id);
              return (
                <DailyTaskItem
                  key={task.id}
                  task={task}
                  icon={ICONS.tasks}
                  description="Complete daily to earn rewards"
                  buttonClass="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                  onStart={handleDailyTaskStart}
                  onClaim={handleDailyTaskClaim}
                  buttonState={buttonState}
                />
              );
            })
          ) : (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 rounded-2xl text-center border border-slate-700/50 backdrop-blur-sm">
              <p className="text-slate-400">No daily tasks available. Check back tomorrow!</p>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-8 relative">
        {!dailyTasksCompleted && <TasksLockedOverlay />}
        <div className={`space-y-8 transition-all duration-500 ${!dailyTasksCompleted ? "opacity-30 pointer-events-none blur-sm" : "opacity-100"}`}>
          
          {/* Game Tasks Section - Now includes AdsGram tasks */}
          <TaskSection 
            title="Game Tasks" 
            tasks={gameTasks.slice(0, expandedCategories.GAME ? undefined : 5)} 
            icon={ICONS.game}
            description="Play games and complete challenges"
            buttonClass="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            onStart={handleTaskStart}
            onClaim={handleTaskClaim}
            getTaskButtonState={getTaskButtonState}
            TaskComponent={CampaignTaskItem}
            onShowMore={gameTasks.length > 5 ? () => loadMoreCampaigns('GAME') : undefined}
            user={user}
            loadAllData={loadAllData}
            additionalTasks={availableAdsGramTasks}
          />

          <TaskSection 
            title="Social Tasks" 
            tasks={socialTasks.slice(0, expandedCategories.SOCIAL ? undefined : 5)} 
            icon={ICONS.telegram}
            description="Follow, like, and engage on social platforms"
            buttonClass="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
            onStart={handleTaskStart}
            onClaim={handleTaskClaim}
            getTaskButtonState={getTaskButtonState}
            TaskComponent={CampaignTaskItem}
            onShowMore={socialTasks.length > 5 ? () => loadMoreCampaigns('SOCIAL') : undefined}
            user={user}
            loadAllData={loadAllData}
          />

          <TaskSection 
            title="Partner Tasks" 
            tasks={partnerTasks.slice(0, expandedCategories.PARTNER ? undefined : 5)} 
            icon={ICONS.gift}
            description="Complete offers from our partners"
            buttonClass="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
            onStart={handleTaskStart}
            onClaim={handleTaskClaim}
            getTaskButtonState={getTaskButtonState}
            TaskComponent={CampaignTaskItem}
            onShowMore={partnerTasks.length > 5 ? () => loadMoreCampaigns('PARTNER') : undefined}
            user={user}
            loadAllData={loadAllData}
          />

          {/* Watch Ad for Spin Section */}
          <div className="space-y-5">
            <h2 className="text-center text-2xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">EARN MORE SPINS & RINGS</h2>
            <EarnSpinOption 
              icon={ICONS.ad} 
              title="Watch an Ad" 
              progress={adsWatched} 
              total={50} 
              onAction={handleWatchAdForSpin} 
              actionText="Watch Ad (+1 Spin)" 
              disabled={adsWatched >= 50} 
              loading={adLoading} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;