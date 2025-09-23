import React, { useState, useEffect } from 'react';
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
} from '../services/api';
import { ICONS, CONVERSION_RATE, TASK_TYPES } from '../constants';

// Declare the ad SDK function the same way as in SpinWheel page
declare const show_9692552: (type?: 'pop') => Promise<void>;

const TasksLockedOverlay = () => (
  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4 rounded-lg">
    <div className="w-16 h-16 mb-4 text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    </div>
    <h3 className="text-xl font-bold text-white">Tasks Locked</h3>
    <p className="text-slate-400 mt-2">Please complete all mandatory daily tasks to unlock more ways to earn.</p>
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
    <section>
      <h2 className="text-xl font-bold mb-4 text-white">Promo Code</h2>
      <div className="bg-slate-800 p-4 rounded-lg space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENTER PROMO CODE"
            className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition uppercase"
            disabled={isLoading}
          />
          <button
            onClick={handleRedeem}
            disabled={!code || isLoading}
            className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Apply'}
          </button>
        </div>
        {feedback && (
          <p className={`text-sm text-center font-semibold pt-2 ${feedback.isError ? 'text-red-500' : 'text-green-500'}`}>
            {feedback.message}
          </p>
        )}
      </div>
    </section>
  );
};

// ---------------- Daily Task Item ----------------
const DailyTaskItem: React.FC<{ 
  task: DailyTask; 
  icon: React.ReactNode;
  description: string;
  buttonClass: string;
  onStart: (taskId: number, taskType?: string) => void;
  onClaim: (taskId: number) => void;
  buttonState: { text: string; disabled: boolean; variant: string };
}> = ({ task, icon, description, buttonClass, onStart, onClaim, buttonState }) => {

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (buttonState.variant === 'claim') {
      onClaim(task.id);
    } else if (buttonState.variant === 'start') {
      onStart(task.id, task.taskType); // Pass task type here
      // Open the link in a new tab for non-ad tasks immediately after starting
      if (task.taskType !== TASK_TYPES.AD && task.link) {
        window.open(task.link, '_blank');
      }
    }
  };

  const reward = (task.cost / (task.goal || 1)) * 0.4 * CONVERSION_RATE;

  // Determine if this is a clickable task (has a link and is not an ad)
  const isClickable = task.link && task.taskType !== TASK_TYPES.AD;
  const href = isClickable ? task.link : '#';
  const target = isClickable ? '_blank' : '_self';

  return (
    <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-grow min-w-0">
        <div className={`bg-slate-700 p-3 rounded-full flex-shrink-0 ${buttonClass.split(' ')[0]}`}>
          {icon}
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-white truncate" title={task.title}>{task.title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
          <p className="text-sm text-green-400 mt-1">+{(reward).toLocaleString()} Coins</p>
        </div>
      </div>
      <a
        href={href}
        target={target}
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`${buttonClass} text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex-shrink-0 ml-2 ${
          buttonState.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        {buttonState.text}
      </a>
    </div>
  );
};

// ---------------- Campaign Task Item ----------------
const CampaignTaskItem: React.FC<{ 
  task: UserCampaign; 
  icon: React.ReactNode;
  description: string;
  buttonClass: string;
  onStart: (taskId: number, taskType?: string) => void;
  onClaim: (taskId: number) => void;
  buttonState: { text: string; disabled: boolean; variant: string };
}> = ({ task, icon, description, buttonClass, onStart, onClaim, buttonState }) => {

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (buttonState.variant === 'claim') {
      onClaim(task.id);
    } else if (buttonState.variant === 'start') {
      onStart(task.id);
    }
  };

  const reward = (task.cost / (task.goal || 1)) * 0.4 * CONVERSION_RATE;

  return (
    <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-grow min-w-0">
        <div className={`bg-slate-700 p-3 rounded-full flex-shrink-0 ${buttonClass.split(' ')[0]}`}>
          {icon}
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-white truncate" title={task.title}>{task.title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
          <p className="text-sm text-green-400 mt-1">+{(reward).toLocaleString()} Coins</p>
        </div>
      </div>
      <a
        href="#"
        onClick={handleClick}
        className={`${buttonClass} text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex-shrink-0 ml-2 ${
          buttonState.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        {buttonState.text}
      </a>
    </div>
  );
};

// ---------------- Generic Task Section ----------------
const TaskSection: React.FC<{
  title: string;
  tasks: any[];
  icon: React.ReactNode;
  description: string;
  buttonClass: string;
  onStart: (taskId: number, taskType?: string) => void;
  onClaim: (taskId: number) => void;
  getTaskButtonState: (taskId: number) => { text: string; disabled: boolean; variant: string };
  TaskComponent?: React.ComponentType<any>;
}> = ({ title, tasks, icon, description, buttonClass, onStart, onClaim, getTaskButtonState, TaskComponent }) => {
  return (
    <section>
      <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const buttonState = getTaskButtonState(task.id);
            const Component = TaskComponent || CampaignTaskItem;
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
              />
            );
          })
        ) : (
          <div className="bg-slate-800 p-6 rounded-lg text-center text-slate-400">
            <p>No {title.toLowerCase()} available right now.</p>
          </div>
        )}
      </div>
    </section>
  );
};

// ---------------- Main Earnings Page ----------------
const EarningsPage: React.FC<{ setUser: (user: User) => void; user: User }> = ({ setUser, user }) => {
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, { started: boolean; completed: boolean }>>({});
  const [dailyTaskStatuses, setDailyTaskStatuses] = useState<Record<string, { started: boolean; completed: boolean; claimed: boolean }>>({});
  const [loadingTasks, setLoadingTasks] = useState<Set<number>>(new Set());
  const [loadingDailyTasks, setLoadingDailyTasks] = useState<Set<number>>(new Set());




   



  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const campaignsData = await fetchAllCampaignsAPI(user.id);
      setCampaigns(campaignsData);

      const dailyTasksData = await fetchIncompleteDailyTasks(user.id);
      setDailyTasks(dailyTasksData);

      const statusResponse = await getUserTaskStatus(user.id);
      if (statusResponse.success) {
        setTaskStatuses(statusResponse.taskStatuses);
      }

      const dailyStatusResponse = await getUserDailyTaskStatus(user.id);
      if (dailyStatusResponse.success) {
        setDailyTaskStatuses(dailyStatusResponse.taskStatuses);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // ---- Ad handling function - use the same approach as SpinWheel page ----
  const showAdIfAvailable = async (): Promise<boolean> => {
    try {
      // Use the same function declaration as in SpinWheel page
      await show_9692552();
      
      return true;
    } catch (e) {
      console.error("Ad failed to show", e);
      // In development, simulate ad success
      if (process.env.NODE_ENV === 'development') {
        console.log("Simulating ad in development");
        return true;
      }
      return false;
    }
  };

  // ---- Daily Task Logic ----
  const handleDailyTaskStart = async (taskId: number, taskType?: string) => {
    setLoadingDailyTasks(prev => new Set(prev).add(taskId));

    try {
      // Find the daily task to get its type
      const task = dailyTasks.find(t => t.id === taskId);
      const actualTaskType = taskType || task?.type;
      
      // Show ad for ad-type tasks before starting
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
        
        // For ad tasks, automatically mark as completed after ad is shown
        if (actualTaskType === TASK_TYPES.AD) {
          // Small delay to allow state update before claiming
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

  const dailyTasksCompleted = dailyTasks.every(task => 
    dailyTaskStatuses[task.id]?.claimed === true
  );

  // ---- Campaign Tasks ----
  const handleTaskStart = async (taskId: number, taskType?: string) => {
    setLoadingTasks(prev => new Set(prev).add(taskId));
    try {
      // // Show ad for ad-type tasks before starting
      // if (taskType === TASK_TYPES.AD) {
      //   if (!adShown) {
      //     alert("Ad failed to load. Please try again.");
      //     return;
      //   }
      // }

      const result = await startTask(user.id, taskId);
      if (result.success) {
        setTaskStatuses(prev => ({
          ...prev,
          [taskId]: { started: true, completed: false }
        }));
        
        const task = campaigns.find(t => t.id === taskId);
        if (task && task.taskType !== TASK_TYPES.AD) {
          window.open(task.link, '_blank');
        }
        
        // For ad tasks, automatically mark as completed after ad is shown
        if (taskType === TASK_TYPES.AD) {
          // Small delay to allow state update before claiming
          setTimeout(() => {
            handleTaskClaim(taskId);
          }, 500);
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

  const gameTasks = campaigns.filter(c => c.category === "GAME");
  const socialTasks = campaigns.filter(c => c.category === "SOCIAL");
  const partnerTasks = campaigns.filter(c => c.category === "PARTNER");

  return (
    <div className="space-y-8">
      <PromoCodeSection setUser={setUser} />

      {/* Daily tasks */}
      <TaskSection 
        title="Daily tasks" 
        tasks={dailyTasks} 
        icon={ICONS.tasks}
        description="Complete daily to earn rewards"
        buttonClass="bg-orange-500 hover:bg-orange-600"
        onStart={handleDailyTaskStart}
        onClaim={handleDailyTaskClaim}
        getTaskButtonState={getDailyTaskButtonState}
        TaskComponent={DailyTaskItem}
      />

      <div className="space-y-8 relative">
        {!dailyTasksCompleted && <TasksLockedOverlay />}
        <div className={`space-y-8 transition-opacity ${!dailyTasksCompleted ? "opacity-20 pointer-events-none" : ""}`}>
          <TaskSection 
            title="Game tasks" 
            tasks={gameTasks} 
            icon={ICONS.game}
            description="Play to earn"
            buttonClass="bg-purple-500 hover:bg-purple-600"
            onStart={handleTaskStart}
            onClaim={handleTaskClaim}
            getTaskButtonState={getTaskButtonState}
            TaskComponent={CampaignTaskItem}
          />

          <TaskSection 
            title="Social tasks" 
            tasks={socialTasks} 
            icon={ICONS.telegram}
            description="Subscribe and react"
            buttonClass="bg-pink-500 hover:bg-pink-600"
            onStart={handleTaskStart}
            onClaim={handleTaskClaim}
            getTaskButtonState={getTaskButtonState}
            TaskComponent={CampaignTaskItem}
          />

          <TaskSection 
            title="Partner tasks" 
            tasks={partnerTasks} 
            icon={ICONS.gift}
            description="Complete partner tasks"
            buttonClass="bg-blue-500 hover:bg-blue-600"
            onStart={handleTaskStart}
            onClaim={handleTaskClaim}
            getTaskButtonState={getTaskButtonState}
            TaskComponent={CampaignTaskItem}
          />
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;