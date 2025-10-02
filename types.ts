import type { ReactNode } from 'react';

export interface SpaceDefenderProgress {
  weaponLevel: number;
  shieldLevel: number;
  speedLevel: number;
}

export interface StreetRacingProgress {
  currentCar: number;
  unlockedCars: number[];
  carUpgrades: {
      [key: number]: {
          speed: number;
          acceleration: number;
          handling: number;
          nitro: number;
      }
  };
  careerPoints: number;
  adProgress: {
    engine: number;
    tires: number;
    nitro: number;
  };
}


// export interface User {
//   id: number;
//   name: string;
//   coins: number;
//   ton: number;
//   referralEarnings: number;
//   spins: number;
//   ad_credit: number;
//   adsWatchedToday: number;
//   tasksCompletedTodayForSpin: number;
//   friendsInvitedTodayForSpin: number;
//   spaceDefenderProgress: SpaceDefenderProgress;
//   streetRacingProgress: StreetRacingProgress;
//   banned?: boolean;
// }

export interface User {
  id: number;
  name: string;
  coins: number;
  ton: number;
  referral_earnings: number;   // snake_case (backend sends this)
  spins: number;
  ad_credit: number;
  adsWatchedToday: number;
  tasksCompletedTodayForSpin: number;
  friendsInvitedTodayForSpin: number;
  spaceDefenderProgress: SpaceDefenderProgress;
  streetRacingProgress: StreetRacingProgress;
  banned: boolean;
  friends: number[];  // backend returns list of friend IDs
}



export interface Task {
  id:string;
  icon: ReactNode;
  title: string;
  reward: number;
  claimed?: boolean;
  category?: 'Daily' | 'Game' | 'Social' | 'Partner';
}

// export interface DailyTask extends Task {
//     mandatory?: boolean;
//     link?: string;
//     action?: 'link' | 'share';
// }


export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionsFilters {
  page?: number;
  limit?: number;
  status?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
}

// types.ts
export interface Quest {
  id: string;
  title: string;
  icon: string;
  reward: number;
  totalProgress: number;
  currentProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  canClaim: boolean;
}

export interface QuestResponse {
  success: boolean;
  quests: Quest[];
  error?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: string;
  currency: string;
  status: string;
  description: string;
  transaction_id_on_blockchain?: string;
  created_at: string;
  date?: string; // For frontend display
}

// types.ts
export interface DailyTask {
  adsgram_block_id: any;
  id: number;
  title: string;
  reward: number;
  category: string;
  link: string;
  status: string;
  completions: number;
  ad_network_id?: number;
  created_at?: string;
  updated_at?: string;
  task_type: string; // ✅ fixed to camelCase
}



export interface GameTask extends Task {}

export interface Quest {
  id: string;
  icon: ReactNode;
  title: string;
  reward: number;
  currentProgress: number;
  totalProgress: number;
}

// export interface Transaction {
//   id: string;
//   type: 'Withdrawal' | 'Deposit';
//   amount: number;
//   currency: 'TON' | 'Coins';
//   date: string;
//   status: 'Completed' | 'Pending' | 'Failed';
// }

export interface CompletionTier {
  completions: number;
  cost: number;
}

export interface LanguageOption {
  id: string;
  name: string;
}

export interface Friend {
  id: number;
  name: string;
}

// --- Enums (match your Python enums) ---

// export type TaskCategory = 'Daily' | 'Game' | 'Social' | 'Partner';
export type CampaignStatus = 'Active' | 'Paused' | 'Completed';
export type TransactionType = 'Withdrawal' | 'Deposit';
export type TransactionCurrency = 'TON' | 'Coins';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';
export type PromoCodeType = 'COINS' | 'TON_AD_CREDIT' | 'SPINS';

// --- UserCampaign ---
export interface UserCampaign {
  id: number;               // auto-increment
  creator_id: number;       // FK -> users.id
  link: string;
  langs: string[];          // JSON array
  status: CampaignStatus;
  completions: number;
  goal: number;             // target number of users
  cost: number;             // Decimal from DB (returned as string from API)
  category: string;
  type: string;             // "user_campaign" | "partner_campaign"
}

// --- PartnerCampaign ---
export interface PartnerCampaign extends UserCampaign {
  requiredLevel: number;
}


export interface PromoCode {
  code: string;
  type: 'COINS' | 'TON_AD_CREDIT' | 'SPINS';
  value: number;
  maxUses: number;
  usedBy: number[]; // array of user IDs
  expiresAt?: string; // ISO date string
}

export interface AdNetwork {
    id: string;
    name: string;
    code: string;
    enabled: boolean;
}

export interface AdminUser {
    id: number;
    username: string;
    password?: string; // Only for creation/update
    permissions: string[];
}