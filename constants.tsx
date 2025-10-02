import React from 'react';
import type { DailyTask, GameTask, Quest, Transaction, CompletionTier, LanguageOption, Friend, UserCampaign, PromoCode, AdminUser, User } from './types';

export const ICONS = {
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),

  stats: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),

  refresh: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"/>
      <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"/>
    </svg>
  ),

  spinner: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="animate-spin">
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 
        17 14.14 18.18 21.02 12 17.77 
        5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  checkIn: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>,
  game: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 6 0"/><path d="m12 9 0 6"/></svg>,
  telegram: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>,
  friends: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  wallet: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  gift: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>,
  trendingUp: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  dollarSign: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  home: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  tasks: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>,
  copy: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  share: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  coin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#FFC700"/><path d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" fill="#FFE44F"/><path d="M14.5 9.12988C14.5 8.64983 14.1952 8.23485 13.75 8.13459M13.75 8.13459C13.5663 8.09017 13.3752 8.06421 13.1786 8.05737C12.5186 8.03437 12.013 7.91351 12.013 7.5C12.013 7.08649 12.5186 6.96563 13.1786 6.94263C13.5539 6.92983 13.9358 6.87915 14.288 6.80414M13.75 8.13459L12.5 17.5M10.25 14.8654C10.25 15.3455 10.5548 15.7605 11 15.8607M11 15.8607C11.1837 15.9052 11.3752 15.9311 11.5714 15.9379C12.2314 15.9609 12.737 16.0818 12.737 16.5C12.737 16.9135 12.2314 17.0344 11.5714 17.0574C11.1961 17.0702 10.8142 17.1208 10.462 17.1959M11 15.8607L12.5 6.5M10.25 9.5H14.5M10.25 14.5H14.25" stroke="#FDB813" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ton: <svg width="16" height="16" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path d="M168.23,61.3,131.77,24.89a8,8,0,0,0-11.54,0L83.77,61.3A8,8,0,0,0,80,67.07V188.93a8,8,0,0,0,3.77,6.77l36.46,36.41a8,8,0,0,0,11.54,0l36.46-36.41A8,8,0,0,0,176,188.93V67.07A8,8,0,0,0,168.23,61.3Z" fill="#0098EA"></path></svg>,
  ad: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>,
  zap: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2z"/></svg>,
  car: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18.5 12.5-3.44 3.44a1 1 0 0 1-1.42-1.42l3.44-3.44a1 1 0 0 1 1.42 1.42z"/><path d="m6.53 17.47-3.44-3.44a1 1 0 0 1 1.42-1.42l3.44 3.44a1 1 0 0 1-1.42 1.42z"/><path d="M2 12h2.5"/><path d="M19.5 12H22"/><path d="M12 2v2.5"/><path d="M12 19.5V22"/><path d="M18 18.5a4.5 4.5 0 1 0-6.36-6.36 4.5 4.5 0 1 0 6.36 6.36z"/><path d="M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>,
  // Admin Icons
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  promoCode: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
};


export const MERCHANT_WALLET_ADDRESS='UQCUj1nsD2CHdyBoO8zIUqwlL-QXpyeUsMbePiegTqURiJu0'

// constants.ts
export const TASK_TYPES = {
  AD: 'ad',
  GAME: 'game',
  SOCIAL: 'social',
  PARTNER: 'partner'
} as const;

// constants/index.ts
export const SPIN_WHEEL_PRIZES = [
  {
    label: "100 Coins",
    value: 100,
    type: "coins",
    color: "linear-gradient(135deg, #FFD700, #FFA500)",
    textColor: "#000"
  },
  {
    label: "250 Coins",
    value: 250,
    type: "coins",
    color: "linear-gradient(135deg, #FFB347, #FFCC33)",
    textColor: "#000"
  },
  {
    label: "500 Coins",
    value: 500,
    type: "coins",
    color: "linear-gradient(135deg, #FFD700, #FF8C00)",
    textColor: "#000"
  },
  {
    label: "1000 Coins",
    value: 1000,
    type: "coins",
    color: "linear-gradient(135deg, #FFA500, #FF4500)",
    textColor: "#fff"
  },
  {
    label: "1 Spin",
    value: 1,
    type: "spins",
    color: "linear-gradient(135deg, #00FF00, #32CD32)",
    textColor: "#000"
  },
  {
    label: "2 Spins",
    value: 2,
    type: "spins",
    color: "linear-gradient(135deg, #32CD32, #228B22)",
    textColor: "#fff"
  },
  {
    label: "5 Spins",
    value: 5,
    type: "spins",
    color: "linear-gradient(135deg, #228B22, #006400)",
    textColor: "#fff"
  },
  {
    label: "0.001 TON",
    value: 0.001,
    type: "ton",
    color: "linear-gradient(135deg, #0099FF, #0066CC)",
    textColor: "#fff"
  },
  {
    label: "0.005 TON",
    value: 0.005,
    type: "ton",
    color: "linear-gradient(135deg, #0066CC, #004499)",
    textColor: "#fff"
  },
  {
    label: "0.01 TON",
    value: 0.01,
    type: "ton",
    color: "linear-gradient(135deg, #004499, #002266)",
    textColor: "#fff"
  },
  {
    label: "Better luck!",
    value: 0,
    type: "none",
    color: "linear-gradient(135deg, #888888, #555555)",
    textColor: "#fff"
  },
  {
    label: "Jackpot!",
    value: 2000,
    type: "coins",
    color: "linear-gradient(135deg, #FF0000, #FF4500)",
    textColor: "#fff"
  }
];


export const INITIAL_USER: User = {
  id: 1,
  name: 'User',
  coins: 10,
  ton: 10,
  referralEarnings: 0,
  spins: 0,
  ad_credit: 10,
  adsWatchedToday: 0,
  tasksCompletedTodayForSpin: 0,
  friendsInvitedTodayForSpin: 0,

  spaceDefenderProgress: {
    weaponLevel: 1,
    shieldLevel: 1,
    speedLevel: 1,
  },
  streetRacingProgress: {
    currentCar: 0,
    unlockedCars: [0],
    carUpgrades: {},
    careerPoints: 0,
    adProgress: {
        engine: 0,
        tires: 0,
        nitro: 0,
    }
  },
};


export const generateMockUsers = (count: number): User[] => {
    const users: User[] = [];
    for (let i = 2; i <= count + 1; i++) {
        users.push({
            ...INITIAL_USER,
            id: i,
            name: `User #${i}`,
            coins: Math.floor(Math.random() * 1000000),
            ton: parseFloat((Math.random() * 10).toFixed(4)),
            spins: Math.floor(Math.random() * 100),
            ad_credit: parseFloat((Math.random() * 5).toFixed(2)),
            banned: Math.random() > 0.9,
        });
    }
    return users;
}


export const DAILY_TASKS: DailyTask[] = [
  { id: 'dt1', icon: ICONS.checkIn, title: 'Just check in', reward: 1000, claimed: false, mandatory: true, category: 'Daily' },
  { id: 'dt2', icon: ICONS.telegram, title: 'Subscribe to our TG channel', reward: 5000, claimed: false, mandatory: true, link: 'https://t.me/CashuBux', action: 'link', category: 'Daily' },
  { id: 'dt3', icon: ICONS.share, title: 'Invite a friend', reward: 2000, claimed: false, mandatory: true, action: 'share', category: 'Daily' },
];

enum CampaignStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused', 
  COMPLETED = 'Completed'
}



// In your types.ts file
export interface DailyTask {
  id: number;
  title: string;
  reward: number;
  category: string;
  ad_network_id?: number;
  link: string;
  status: CampaignStatus;
  completions: number;
  task_type: string;
  adsgram_block_id?: string; // Add this
  created_at: string;
  updated_at: string;
  // ... other properties
}

export const GAME_TASKS: GameTask[] = [];

export const QUESTS: Quest[] = [
  { id: 'q_invite_300', icon: ICONS.friends, title: 'Invite 300 friends', reward: 300000, currentProgress: 0, totalProgress: 300 },
  
  // Game Tasks (Tiered)
  { id: 'q_game_10', icon: ICONS.game, title: 'Complete 10 game tasks', reward: 10000, currentProgress: 0, totalProgress: 10 },
  { id: 'q_game_25', icon: ICONS.game, title: 'Complete 25 game tasks', reward: 25000, currentProgress: 0, totalProgress: 25 },
  { id: 'q_game_50', icon: ICONS.game, title: 'Complete 50 game tasks', reward: 50000, currentProgress: 0, totalProgress: 50 },
  { id: 'q_game_100', icon: ICONS.game, title: 'Complete 100 game tasks', reward: 100000, currentProgress: 0, totalProgress: 100 },
  { id: 'q_game_500', icon: ICONS.game, title: 'Complete 500 game tasks', reward: 500000, currentProgress: 0, totalProgress: 500 },
  { id: 'q_game_1000', icon: ICONS.game, title: 'Complete 1,000 game tasks', reward: 1000000, currentProgress: 0, totalProgress: 1000 },
  { id: 'q_game_2500', icon: ICONS.game, title: 'Complete 2,500 game tasks', reward: 2500000, currentProgress: 0, totalProgress: 2500 },

  // Social Tasks (Tiered)
  { id: 'q_social_10', icon: ICONS.telegram, title: 'Complete 10 social tasks', reward: 10000, currentProgress: 0, totalProgress: 10 },
  { id: 'q_social_25', icon: ICONS.telegram, title: 'Complete 25 social tasks', reward: 25000, currentProgress: 0, totalProgress: 25 },
  { id: 'q_social_50', icon: ICONS.telegram, title: 'Complete 50 social tasks', reward: 50000, currentProgress: 0, totalProgress: 50 },
  { id: 'q_social_100', icon: ICONS.telegram, title: 'Complete 100 social tasks', reward: 100000, currentProgress: 0, totalProgress: 100 },
  { id: 'q_social_500', icon: ICONS.telegram, title: 'Complete 500 social tasks', reward: 500000, currentProgress: 0, totalProgress: 500 },
  { id: 'q_social_1000', icon: ICONS.telegram, title: 'Complete 1,000 social tasks', reward: 1000000, currentProgress: 0, totalProgress: 1000 },
  { id: 'q_social_2500', icon: ICONS.telegram, title: 'Complete 2,500 social tasks', reward: 2500000, currentProgress: 0, totalProgress: 2500 },
  
  // Partner Tasks (Tiered)
  { id: 'q_partner_10', icon: ICONS.gift, title: 'Complete 10 partner tasks', reward: 100000, currentProgress: 0, totalProgress: 10 },
  { id: 'q_partner_25', icon: ICONS.gift, title: 'Complete 25 partner tasks', reward: 250000, currentProgress: 0, totalProgress: 25 },
  { id: 'q_partner_50', icon: ICONS.gift, title: 'Complete 50 partner tasks', reward: 500000, currentProgress: 0, totalProgress: 50 },
  { id: 'q_partner_100', icon: ICONS.gift, title: 'Complete 100 partner tasks', reward: 1200000, currentProgress: 0, totalProgress: 100 },
];


export const TRANSACTIONS: Transaction[] = [];
export const MIN_WITHDRAWAL_COINS = 1000;

export const COMPLETION_TIERS: CompletionTier[] = [
    { completions: 250, cost: 0.50 },
    { completions: 500, cost: 0.75 },
    { completions: 1000, cost: 1.5 },
    { completions: 2000, cost: 3.0 },
    { completions: 5000, cost: 7.5 },
    { completions: 10000, cost: 15.0 },
    { completions: 25000, cost: 37.5 },
    { completions: 50000, cost: 75.0 },
    { completions: 100000, cost: 150.0 },
];

export const LANGUAGE_OPTIONS: LanguageOption[] = [
    { id: 'en', name: 'English' },
    { id: 'ar', name: 'Arabic' },
    { id: 'es', name: 'Spanish' },
    { id: 'ru', name: 'Russian' },
    { id: 'de', name: 'German' },
    { id: 'fr', name: 'French' },
    { id: 'pt', name: 'Portuguese' },
    { id: 'it', name: 'Italian' },
    { id: 'zh', name: 'Chinese' },
    { id: 'ja', name: 'Japanese' },
    { id: 'hi', name: 'Hindi' },
    { id: 'tr', name: 'Turkish' },
];


export const MOCK_FRIENDS: Friend[] = [];

export const MOCK_USER_CAMPAIGNS: UserCampaign[] = [];

export const MOCK_PROMO_CODES: PromoCode[] = [
    { code: 'WELCOME_COINS', type: 'COINS', value: 25000, maxUses: 1000, usedBy: [], expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { code: 'SPIN_ME', type: 'SPINS', value: 3, maxUses: 500, usedBy: [] },
    { code: 'AD_BONUS', type: 'TON_AD_CREDIT', value: 0.5, maxUses: 200, usedBy: [] },
    { code: 'USED_CODE', type: 'COINS', value: 100, maxUses: 100, usedBy: [1] },
    { code: 'EXPIRED_CODE', type: 'COINS', value: 100, maxUses: 2, usedBy: [2, 3], expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

export const CONVERSION_RATE = 10000000;
export const MIN_WITHDRAWAL_TON=0.001;
export const RECIPIENT_WALLET_ADDRESS = 'UQCUj1nsD2CHdyBoO8zIUqwlL-QXpyeUsMbePiegTqURiJu0'; // Placeholder address


// As per the user's latest request to remove TON and fix the wheel,
// all prizes are now COINS only with a re-balanced and simplified weight system.
// This eliminates the risk of incorrect prize distribution and crediting failures.


// export const SPIN_WHEEL_PRIZES = [
//     { type: 'COINS', value: 100,  weight: 40, label: '100' },   // ~32.0% chance
//     { type: 'COINS', value: 50,   weight: 25, label: '50' },    // ~20.0% chance
//     { type: 'COINS', value: 500,  weight: 10, label: '500' },   // ~8.0% chance
//     { type: 'COINS', value: 1000, weight: 5,  label: '1K' },    // ~4.0% chance
//     { type: 'COINS', value: 250,  weight: 15, label: '250' },   // ~12.0% chance
//     { type: 'COINS', value: 2500, weight: 3,  label: '2.5K' },  // ~2.4% chance
//     { type: 'COINS', value: 5000, weight: 1,  label: '5K' },    // ~0.8% chance
//     { type: 'COINS', value: 75,   weight: 25, label: '75' }     // ~20.0% chance
// ];


export const SPIN_STORE_PACKAGES = [
    { id: 'sp10', spins: 10, costTon: 0.02 },
    { id: 'sp50', spins: 50, costTon: 0.1 },
    { id: 'sp100', spins: 100, costTon: 0.2 },
    { id: 'sp500', spins: 500, costTon: 1.0 },
    { id: 'sp1000', spins: 1000, costTon: 2.0 },
    { id: 'sp5000', spins: 5000, costTon: 10.0 },
    { id: 'sp10000', spins: 10000, costTon: 20.0 },
    { id: 'sp50000', spins: 50000, costTon: 100.0 },
];

// --- ADMIN PANEL CONSTANTS ---

export const MOCK_ADMINS: AdminUser[] = [
    { id: 1, username: 'admin', password: 'CashUBux2025!', permissions: ['all'] },
    { id: 2, username: 'moderator', password: 'password', permissions: ['users', 'tasks'] },
];


export const ALL_PERMISSIONS = ['users', 'tasks', 'promocodes', 'settings'];
