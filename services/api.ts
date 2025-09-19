import type { User, DailyTask, GameTask, Quest, Transaction, Friend, UserCampaign, PartnerCampaign, PromoCode, AdNetwork, AdminUser, Task } from '../types';
import { INITIAL_USER, DAILY_TASKS, GAME_TASKS, QUESTS, TRANSACTIONS, CONVERSION_RATE, MOCK_FRIENDS, MOCK_USER_CAMPAIGNS, MOCK_PROMO_CODES, SPIN_WHEEL_PRIZES, SPIN_STORE_PACKAGES, MOCK_ADMINS, generateMockUsers, ICONS } from '../constants';
import { get } from 'http';

// In-memory store
let users: User[] = [ { ...INITIAL_USER }, ...generateMockUsers(50) ];
let dailyTasks: DailyTask[] = [...DAILY_TASKS];
export type CreateDailyTaskDTO = Omit<DailyTask, "id" | "status" | "completions" | "created_at" | "updated_at">;



let gameTasks: UserCampaign[] = [...MOCK_USER_CAMPAIGNS].filter(c => c.category === 'Game');
let socialTasks: UserCampaign[] = [...MOCK_USER_CAMPAIGNS].filter(c => c.category === 'Social');


let partnerCampaigns: PartnerCampaign[] = [];
let quests: Quest[] = [...QUESTS];
let transactions: Transaction[] = [...TRANSACTIONS];
let userCampaigns: UserCampaign[] = [...MOCK_USER_CAMPAIGNS];

let promoCodes: PromoCode[] = [...MOCK_PROMO_CODES];

let admins: AdminUser[] = [...MOCK_ADMINS];

let settings = {
    autoWithdrawals: false,
    adNetworks: [
        { id: 'libtl', name: 'libtl.com', code: `<script src='//libtl.com/sdk.js' data-zone='9692552' data-sdk='show_9692552'></script>`, enabled: true },
    ] as AdNetwork[]
};

const simulateDelay = (delay = 500) => new Promise(resolve => setTimeout(resolve, delay));

// --- User-facing API ---


// const API_BASE_URL = 'http://127.0.0.1:5000';
const API_BASE_URL = 'https://api.cashubux.com/';

// const API_BASE_URL = 'https://aa898d1a38a2.ngrok-free.app';

// JWT Token management
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('auth_token');
};

// Admin Token management
export const setAdminToken = (token: string) => {
  localStorage.setItem('admin_token', token);
};

export const getAdminToken = (): string | null => {
  return localStorage.getItem('admin_token');
};

export const clearAdminToken = () => {
  localStorage.removeItem('admin_token');
};

// Token refresh function
export const refreshToken = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) return false;
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setAuthToken(data.token);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  
  clearAuthToken();
  return false;
};

// Handle unauthorized responses
const handleUnauthorized = async (): Promise<boolean> => {
  try {
    const refreshed = await refreshToken();
    return refreshed;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};



// Main API fetch function with JWT support
// export const apiFetch = async <T = any>(
//   endpoint: string,
//   options: RequestInit = {},
//   retry = true
// ): Promise<T> => {
//   const headers: HeadersInit = {
//     'Content-Type': 'application/json',
//     ...options.headers,
//   };

//   // Add JWT token if available (for regular users)
//   const token = getAuthToken();
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//     console.log(`[apiFetch] Using user token for ${endpoint}`);
//   }

//   // Add admin token if available (for admin routes)
//   const adminToken = getAdminToken();
//   if (adminToken && !token) {
//     headers['Authorization'] = `Bearer ${adminToken}`;
//     console.log(`[apiFetch] Using admin token for ${endpoint}`);
//   }

//   console.log(`[apiFetch] Starting request: ${endpoint}`, {
//     method: options.method || 'GET',
//     headers,
//     body: options.body,
//   });



//   try {
//     const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//       ...options,
//       headers,
//       // credentials: 'include',
//     });

//     console.log(`[apiFetch] Received response for ${endpoint}:`, {
//       status: response.status,
//     });

//     // Handle unauthorized responses (token expired)
//     if (response.status === 401 && retry) {
//       console.warn(`[apiFetch] 401 Unauthorized - trying to refresh token for ${endpoint}`);
//       const refreshed = await handleUnauthorized();
//       if (refreshed) {
//         console.log(`[apiFetch] Token refreshed, retrying request to ${endpoint}`);
//         return apiFetch(endpoint, options, false);
//       }
//     }

//     if (response.status === 401) {
//       clearAuthToken();
//       clearAdminToken();
//       window.dispatchEvent(new Event('unauthorized'));
//       console.error(`[apiFetch] Authentication failed for ${endpoint}`);
//       throw {
//         status: response.status,
//         data: { message: 'Authentication required' },
//       };
//     }

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({
//         message: response.statusText,
//       }));
//       console.error(`[apiFetch] Error response from ${endpoint}:`, errorData);
//       throw { status: response.status, data: errorData };
//     }

//     if (response.status === 204) {
//       console.log(`[apiFetch] No content (204) from ${endpoint}`);
//       return null as T;
//     }

//     const data = await response.json();
//     console.log(`[apiFetch] Success response from ${endpoint}:`, data);
//     return data as T;

//   } catch (error) {
//     console.error(`[apiFetch] API Error on ${endpoint}:`, error);
//     throw error;
//   }
// };

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add JWT token if available (for regular users)
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`[apiFetch] Using user token for ${endpoint}`);
  }

  // Add admin token if available (for admin routes)
  const adminToken = getAdminToken();
  if (adminToken && !token) {
    headers['Authorization'] = `Bearer ${adminToken}`;
    console.log(`[apiFetch] Using admin token for ${endpoint}`);
  }

  console.log(`[apiFetch] Starting request: ${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      // credentials: 'same-origin',
    });

    console.log(`[apiFetch] Received response for ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    // First, get the response as text to see what we're dealing with
    const responseText = await response.text();
    console.log(`[apiFetch] Raw response text (first 200 chars):`, responseText.substring(0, 200));

    // Check if this is HTML instead of JSON
    if (responseText.trim().startsWith('<!DOCTYPE') || 
        responseText.trim().startsWith('<html') || 
        responseText.includes('</html>')) {
      console.error(`[apiFetch] HTML detected in response for ${endpoint}`);
      
      // Handle unauthorized responses (token expired) even for HTML responses
      if (response.status === 401 && retry) {
        console.warn(`[apiFetch] 401 Unauthorized - trying to refresh token for ${endpoint}`);
        const refreshed = await handleUnauthorized();
        if (refreshed) {
          console.log(`[apiFetch] Token refreshed, retrying request to ${endpoint}`);
          return apiFetch(endpoint, options, false);
        }
      }

      if (response.status === 401) {
        clearAuthToken();
        clearAdminToken();
        window.dispatchEvent(new Event('unauthorized'));
        console.error(`[apiFetch] Authentication failed for ${endpoint}`);
        throw {
          status: response.status,
          data: { message: 'Authentication required' },
          html: responseText.substring(0, 200) // Include snippet for debugging
        };
      }

      // Throw a specific error for HTML responses
      throw {
        status: response.status,
        data: { 
          message: 'Server returned HTML instead of JSON',
          htmlSnippet: responseText.substring(0, 200)
        },
        isHtml: true
      };
    }

    // Handle unauthorized responses (token expired)
    if (response.status === 401 && retry) {
      console.warn(`[apiFetch] 401 Unauthorized - trying to refresh token for ${endpoint}`);
      const refreshed = await handleUnauthorized();
      if (refreshed) {
        console.log(`[apiFetch] Token refreshed, retrying request to ${endpoint}`);
        return apiFetch(endpoint, options, false);
      }
    }

    if (response.status === 401) {
      clearAuthToken();
      clearAdminToken();
      window.dispatchEvent(new Event('unauthorized'));
      console.error(`[apiFetch] Authentication failed for ${endpoint}`);
      throw {
        status: response.status,
        data: { message: 'Authentication required' },
      };
    }

    if (!response.ok) {
      // Try to parse as JSON, but fallback to text
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { 
          message: response.statusText || 'Request failed',
          rawResponse: responseText.substring(0, 200)
        };
      }
      console.error(`[apiFetch] Error response from ${endpoint}:`, errorData);
      throw { status: response.status, data: errorData };
    }

    if (response.status === 204) {
      console.log(`[apiFetch] No content (204) from ${endpoint}`);
      return null as T;
    }

    // Parse the JSON response
    try {
      const data = JSON.parse(responseText);
      console.log(`[apiFetch] Success response from ${endpoint}:`, data);
      return data as T;
    } catch (parseError) {
      console.error(`[apiFetch] JSON parse error for ${endpoint}:`, parseError);
      throw {
        status: response.status,
        data: { 
          message: 'Invalid JSON response',
          rawResponse: responseText.substring(0, 200)
        }
      };
    }

  } catch (error) {
    console.error(`[apiFetch] API Error on ${endpoint}:`, error);
    throw error;
  }
};



// User API functions
export const getCurrentUserAPI = async (): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const res = await apiFetch<any>('/user/me', {
      method: 'GET',
    });

    if ("error" in res) {
      return {
        success: false,
        message: res.error,
      };
    }

    return {
      success: true,
      message: "User fetched successfully",
      user: res as User,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.data?.message || 'Failed to fetch user',
    };
  }
};

export const devLogin = async (userId: number): Promise<User> => {
  const response = await apiFetch<any>(`/dev/login/${userId}`, {
    method: 'POST',
  });

  if (response.token) {
      setAuthToken(response.token);
    }

  return {
    ...response,
    spaceDefenderProgress: response.spaceDefenderProgress || INITIAL_USER.spaceDefenderProgress,
    streetRacingProgress: response.streetRacingProgress || INITIAL_USER.streetRacingProgress,
  };
};


export const loginWithTelegram = async (telegramInitData: string): Promise<User> => {
  try {
    // Extract start parameter from Telegram WebApp
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param || '';
    
    const response = await apiFetch<any>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ 
        initData: telegramInitData,
        startParam: startParam // Add this line
      }),
    });

    // Store the JWT token if provided by the backend
    if (response.token) {
      setAuthToken(response.token);
    }

    return {
      ...response.user || response,
      spaceDefenderProgress: response.spaceDefenderProgress || response.user?.spaceDefenderProgress || INITIAL_USER.spaceDefenderProgress,
      streetRacingProgress: response.streetRacingProgress || response.user?.streetRacingProgress || INITIAL_USER.streetRacingProgress,
    };
  } catch (error) {
    console.error('Telegram login failed:', error);
    throw error;
  }
};




// Campaign API functions - FIXED to use apiFetch correctly
export const fetchAllCampaignsAPI = async (userId: number): Promise<(UserCampaign | PartnerCampaign)[]> => {
  return apiFetch<(UserCampaign | PartnerCampaign)[]>(`/campaigns?user_id=${userId}`, {
    method: 'GET',
  });
};


export const fetchUserCampaignsAPI = async (userId: number): Promise<(UserCampaign | PartnerCampaign)[]> => {
  return apiFetch<(UserCampaign | PartnerCampaign)[]>(`/my-campaigns?user_id=${userId}`, {
    method: 'GET',
  });
};


// export const fetchMyCreatedCampaignsAPI = async (): Promise<(UserCampaign | PartnerCampaign)[]> => {
//   return apiFetch<(UserCampaign | PartnerCampaign)[]>('/my-campaigns', {
//     method: 'GET',
//   });
// };

export const validateSubscription = async (
  userId: number,
  channelUsername: string,
  campaignId: number
): Promise<{ 
  success: boolean; 
  message: string; 
  reward?: number;
}> => {
  return apiFetch('/validate/subscription', {
    method: 'POST',
    body: JSON.stringify({ 
      user_id: userId, 
      channel_username: channelUsername, 
      campaign_id: campaignId 
    }),
  });
};

export const addUserCampaignAPI = async (
  campaignData: {
    userid: number;
    link: string;
    goal: number;
    cost: number;
    level?: number;
    category: string;
    languages: Array<string>;
    checkSubscription?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  newCampaign?: UserCampaign & { webhookToken?: string; requiredLevel?: number };
  user?: User;
}> => {
  const payload: any = {
    user_id: campaignData.userid, // ✅ changed from userid to user_id
    link: campaignData.link,
    goal: campaignData.goal,
    cost: campaignData.cost,
    languages: campaignData.languages,
    category: campaignData.category,
    checkSubscription: campaignData.checkSubscription || false,
  };

  if (campaignData.level !== undefined) {
    payload.requiredLevel = campaignData.level;
  }

  return apiFetch('/addusercampaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};






// In your services/api.ts file
export const checkCampaignCompletion = async (campaignIds: number[]): Promise<number[]> => {
  try {
    // This would be an API call to your backend to check which campaigns the user has completed
    const response = await fetch('/api/campaigns/completion-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaignIds }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to check campaign completion status');
    }
    
    const data = await response.json();
    return data.completedCampaignIds || [];
  } catch (error) {
    console.error('Error checking campaign completion:', error);
    return [];
  }
};



export const startTask = async (
  userId: number,
  taskId: number
): Promise<{ 
  success: boolean; 
  message: string; 
  status?: string;
  user?: User;  // Add user to response
}> => {
  return apiFetch(`/tasks/start`, {
    method: "POST",
    body: JSON.stringify({ userId, taskId }),
  });
};

export const claimTask = async (
  userId: number,
  taskId: number
): Promise<{ 
  success: boolean; 
  message: string; 
  user?: User;
  reward?: number;
}> => {
  return apiFetch(`/tasks/claim`, {
    method: "POST",
    body: JSON.stringify({ userId, taskId }),
  });
};



export const getUserTaskStatus = async (
  userId: number
): Promise<{ success: boolean; taskStatuses: Record<string, { started: boolean; completed: boolean }> }> => {
  return apiFetch(`/user/tasks/status?userId=${userId}`);
};


// === SETTINGS ===
export const fetchSettings = async (): Promise<{ autoWithdrawals: boolean }> => {
  return apiFetch('/settings'); // GET /api/settings
};

export const updateSettings = async (
  newSettings: Partial<{ autoWithdrawals: boolean }>
): Promise<{ success: boolean; settings: { autoWithdrawals: boolean } }> => {
  return apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(newSettings),
  });
};

// === AD NETWORKS ===
export const fetchAdNetworks = async (): Promise<AdNetwork[]> => {
  return apiFetch('/ad-networks'); // GET /api/ad-networks
};

export const addAdNetwork = async (
  network: Omit<AdNetwork, 'id'>
): Promise<AdNetwork> => {
  return apiFetch('/ad-networks', {
    method: 'POST',
    body: JSON.stringify(network),
  });
};

export const toggleAdNetwork = async (
  networkId: string,
  enabled: boolean
): Promise<AdNetwork> => {
  return apiFetch(`/ad-networks/${networkId}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
};







//Daily Tasks End Points



export const createDailyTask = async (task: CreateDailyTaskDTO) => {
  return apiFetch('/daily-tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
};

export const fetchDailyTasksAPI = async () => {
  return apiFetch('/daily-tasks', { method: 'GET' });
};




// services/api.ts
export const startDailyTask = async (
  userId: number,
  taskId: number
): Promise<{ 
  success: boolean; 
  message: string; 
  status?: string;
  user?: any;              // optional updated user object
  task?: any;              // the started task (DailyTask)
  adFunction?: string;     // ✅ which ad SDK function to call, e.g. "show_9692552"
}> => {
  return apiFetch(`/daily-tasks/start`, {
    method: "POST",
    body: JSON.stringify({ userId, taskId }),
  });
};


export const claimDailyTask = async (
  userId: number,
  taskId: number
): Promise<{ 
  success: boolean; 
  message: string; 
  user?: User;
  reward?: number;
}> => {
  return apiFetch(`/daily-tasks/claim`, {
    method: "POST",
    body: JSON.stringify({ userId, taskId }),
  });
};

export const getUserDailyTaskStatus = async (
  userId: number
): Promise<{ success: boolean; taskStatuses: Record<string, { started: boolean; completed: boolean; claimed: boolean }> }> => {
  return apiFetch(`/user/daily-tasks/status?userId=${userId}`);
};






// services/api.ts
export const fetchDailyTasks = async (): Promise<DailyTask[]> => {
  return apiFetch<DailyTask[]>('/admin/daily-tasks');
};

export const deleteDailyTask = async (taskId: number): Promise<{ success: boolean; message: string }> => {
  return apiFetch(`/admin/daily-tasks/${taskId}`, {
    method: 'DELETE',
  });
};

export const updateDailyTaskStatus = async (
  taskId: number, 
  status: 'ACTIVE' | 'PAUSED'
): Promise<{ success: boolean; message: string }> => {
  return apiFetch(`/admin/daily-tasks/${taskId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};


// services/api.ts
export const claimReferralEarnings = async (userId: number): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> => {
  return apiFetch('/api/referral/claim', {
    method: 'POST',
    body: JSON.stringify({ userId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const inviteFriendForSpin = async (userId: number): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> => {
  return apiFetch('/api/referral/invite', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
};


export const fetchFriends = async (userId: number): Promise<Friend[]> => {
  const result = await apiFetch(`/api/referral/friends?user_id=${userId}`);
  return result.friends || [];
};



export const getReferralInfo = async (userId: number): Promise<{
  referral_code: string;
  referral_link: string;
  referral_count: number;
  claimable_earnings: number;
  total_earnings: number;
  today_invites: number;
  max_daily_invites: number;
  spins_awarded?: number;
}> => {
  const response = await apiFetch(`/api/referral/info?user_id=${userId}`);
  
  // If the response has success: true, extract the data
  if (response.success && response.referral_code) {
    return response;
  }
  
  // If the data is at the root level (without success wrapper), return directly
  if (response.referral_code) {
    return response;
  }
  
  // Fallback: return empty data structure
  return {
    referral_code: userId.toString(),
    referral_link: `https://t.me/CashUBux_bot?startapp=ref_${userId}`,
    referral_count: 0,
    claimable_earnings: 0,
    total_earnings: 0,
    today_invites: 0,
    max_daily_invites: 50,
    spins_awarded: 0
  };
};




// services/api.ts
// export const fetchAllUsers = async (): Promise<User[]> => {
//   try {
//     console.log('[fetchAllUsers] Making API call to /users');
    
//     const response = await apiFetch('/users', {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     console.log('[fetchAllUsers] Response received:', response);
//     console.log('[fetchAllUsers] Response.ok:', response?.ok);
//     console.log('[fetchAllUsers] Response status:', response?.status);

//     // Check if response exists and has the expected properties
//     if (!response) {
//       throw new Error('No response received from server');
//     }

//     if (typeof response.ok === 'undefined') {
//       // If response doesn't have ok property, it might be the actual data
//       console.log('[fetchAllUsers] Response does not have ok property, assuming it\'s the data');
//       return response as unknown as User[];
//     }

//     if (!response.ok) {
//       const errorText = await response.text().catch(() => 'Unknown error');
//       throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
//     }

//     // Try to parse as JSON, but handle cases where it might already be parsed
//     let data;
//     if (typeof response.json === 'function') {
//       data = await response.json();
//     } else {
//       // If response doesn't have json method, assume it's already the data
//       data = response;
//     }

//     console.log('[fetchAllUsers] Parsed data:', data);
//     return data;

//   } catch (error) {
//     console.error('Error fetching users:', error);
//     throw new Error('Failed to fetch users');
//   }
// };




// Interface for paginated response
interface PaginatedResponse<T> {
  users: T[];
  total: number;
  pages: number;
  current_page: number;
}

export const fetchAllUsers = async (page: number = 1, perPage: number = 50, banned?: boolean): Promise<PaginatedResponse<User>> => {
  try {
    console.log('[fetchAllUsers] Making API call to /admin/users');
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    if (banned !== null) {
      params.append('banned', banned.toString());
    }

    const response = await apiFetch(`/users?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[fetchAllUsers] Response received:', response);
    return response as PaginatedResponse<User>;

  } catch (error) {
    console.error('Failed to fetch all users:', error);
    // Return empty paginated response on error
    return {
      users: [],
      total: 0,
      pages: 0,
      current_page: page
    };
  }
};

export const fetchUserById = async (userId: string): Promise<User> => {
  try {
    console.log(`[fetchUserById] Making API call to /admin/users/${userId}`);
    
    const response = await apiFetch(`/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`[fetchUserById] Response received:`, response);
    return response as User;

  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  try {
    console.log(`[updateUser] Making API call to update user ${userId}`);
    
    const response = await apiFetch(`/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    console.log(`[updateUser] Response received:`, response);
    return response as User;

  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error);
    throw error;
  }
};

export const banUser = async (userId: string): Promise<User> => {
  try {
    console.log(`[banUser] Making API call to ban user ${userId}`);
    
    const response = await apiFetch(`/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ banned: true })
    });

    console.log(`[banUser] Response received:`, response);
    return response as User;

  } catch (error) {
    console.error(`Failed to ban user ${userId}:`, error);
    throw error;
  }
};

export const unbanUser = async (userId: string): Promise<User> => {
  try {
    console.log(`[unbanUser] Making API call to unban user ${userId}`);
    
    const response = await apiFetch(`/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ banned: false })
    });

    console.log(`[unbanUser] Response received:`, response);
    return response as User;

  } catch (error) {
    console.error(`Failed to unban user ${userId}:`, error);
    throw error;
  }
};

export const updateUserCurrency = async (userId: string, currencyData: {
  coins?: number;
  ton?: number;
  referral_earnings?: number;
  spins?: number;
  ad_credit?: number;
}): Promise<User> => {
  try {
    console.log(`[updateUserCurrency] Making API call to update currency for user ${userId}`);
    
    const response = await apiFetch(`/admin/users/${userId}/currency`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currencyData)
    });

    console.log(`[updateUserCurrency] Response received:`, response);
    return response as User;

  } catch (error) {
    console.error(`Failed to update currency for user ${userId}:`, error);
    throw error;
  }
};

export const updateGameProgress = async (userId: string, gameData: {
  space_defender_progress?: any;
  street_racing_progress?: any;
}): Promise<User> => {
  try {
    console.log(`[updateGameProgress] Making API call to update game progress for user ${userId}`);
    
    const response = await apiFetch(`/admin/users/${userId}/game-progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData)
    });

    console.log(`[updateGameProgress] Response received:`, response);
    return response as User;

  } catch (error) {
    console.error(`Failed to update game progress for user ${userId}:`, error);
    throw error;
  }
};

export const resetDailyStats = async (userId: string): Promise<User> => {
  try {
    console.log(`[resetDailyStats] Making API call to reset daily stats for user ${userId}`);
    
    const response = await apiFetch(`/admin/users/${userId}/reset-daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log(`[resetDailyStats] Response received:`, response);
    return response as User;

  } catch (error) {
    console.error(`Failed to reset daily stats for user ${userId}:`, error);
    throw error;
  }
};

export const searchUsers = async (query: string, field: string = 'name'): Promise<User[]> => {
  try {
    console.log(`[searchUsers] Making API call to search users with query "${query}"`);
    
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('field', field);

    const response = await apiFetch(`/admin/users/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`[searchUsers] Response received:`, response);
    return response as User[];

  } catch (error) {
    console.error(`Failed to search users with query "${query}":`, error);
    return [];
  }
};

export const bulkUpdateUsers = async (userIds: string[], updates: Partial<User>): Promise<User[]> => {
  try {
    console.log(`[bulkUpdateUsers] Making API call to bulk update ${userIds.length} users`);
    
    const response = await apiFetch(`/admin/users/bulk-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds, updates })
    });

    console.log(`[bulkUpdateUsers] Response received:`, response);
    return response as User[];

  } catch (error) {
    console.error('Failed to bulk update users:', error);
    throw error;
  }
};

export const exportUsers = async (format: 'csv' | 'json' = 'json'): Promise<Blob> => {
  try {
    console.log(`[exportUsers] Making API call to export users in ${format} format`);
    
    // For file downloads, we might need to use fetch directly if apiFetch processes responses
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/admin/users/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return await response.blob();

  } catch (error) {
    console.error('Failed to export users:', error);
    throw error;
  }
};

// Utility functions for specific admin actions
export const addCoinsToUser = async (userId: string, amount: number): Promise<User> => {
  return updateUserCurrency(userId, { coins: amount });
};

export const addTONToUser = async (userId: string, amount: number): Promise<User> => {
  return updateUserCurrency(userId, { ton: amount });
};

export const addSpinsToUser = async (userId: string, amount: number): Promise<User> => {
  return updateUserCurrency(userId, { spins: amount });
};

export const resetUserProgress = async (userId: string, game: 'space_defender' | 'street_racing' | 'all'): Promise<User> => {
  const resetData: any = {};

  if (game === 'space_defender' || game === 'all') {
    resetData.space_defender_progress = { "weaponLevel": 1, "shieldLevel": 1, "speedLevel": 1 };
  }

  if (game === 'street_racing' || game === 'all') {
    resetData.street_racing_progress = {
      "currentCar": 1,
      "unlockedCars": [1],
      "carUpgrades": {},
      "careerPoints": 0,
      "adProgress": { "engine": 0, "tires": 0, "nitro": 0 }
    };
  }

  return updateGameProgress(userId, resetData);
};




// export const executeWithdrawal = async (amountInTon: number): Promise<{ success: boolean; user: User | null }> => {
//     await simulateDelay(1500);
//     const amountInCoins = amountInTon * CONVERSION_RATE;
//     if (users[0].coins >= amountInCoins) {
//         users[0].coins -= amountInCoins;
//         users[0].ton += amountInTon;
//         transactions.unshift({
//             id: `t${Date.now()}`,
//             type: 'Withdrawal',
//             amount: amountInTon,
//             currency: 'TON',
//             date: new Date().toISOString().split('T')[0],
//             status: 'Completed'
//         });
//         return { success: true, user: { ...users[0] } };
//     }
//     return { success: false, user: null };
// }


//here all the magic 
export const depositAdCreditAPI = async (
  userId: number, 
  amount: number,
  transactionHash?: string
): Promise<{ success: boolean; user: User; message?: string }> => {
  try {
    const payload: any = { 
      user_id: userId, 
      amount: amount 
    };
    
    if (transactionHash) {
      payload.transaction_hash = transactionHash;
      payload.payment_method = 'BLOCKCHAIN';
    }

    const data = await apiFetch<{ success: boolean; user: User; message?: string }>('/user/deposit-ad-credit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('Deposit API response:', data);

    if (!data.success) {
      throw new Error(data.message || 'Deposit failed');
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('Deposit error:', error);
    return { 
      success: false, 
      user: null,
      message: error.data?.message || error.message || 'Deposit failed'
    };
  }
};



// services/api.ts - Add these functions
// The response type from your Flask backend
interface SpinResponse {
  success: boolean;
  prize: {
    label: string;
    value: number;
    type: string;
  } | null;
  user: User | null;
  message: string; // The missing property
}

export const spinWheel = async (userId: number): Promise<SpinResponse> => {
  try {
    // We pass the corrected SpinResponse type to apiFetch
    const data = await apiFetch<SpinResponse>('/spin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Your apiFetch helper should automatically add the Authorization header
      },
      // Ensure you are sending 'user_id' to match your corrected backend
      body: JSON.stringify({ user_id: userId })
    });

    if (!data.success) {
      // Now we can safely access data.message
      throw new Error(data.message || 'Spin failed on the backend.');
    }

    return data;

  } catch (error) {
    console.error('Spin Wheel API error:', error);
    // Return a response that matches the SpinResponse type for consistency
    return { 
      success: false, 
      prize: null, 
      user: null,
      message: error instanceof Error ? error.message : 'A network error occurred.'
    };
  }
};

// This is your existing function, shown for context.
// You should also ensure its return type is correct.
interface DepositResponse {
    success: boolean;
    user: User | null; // Assuming the backend might return null on failure
}


export const watchAdForSpin = async (userId: number): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> => {
  return apiFetch('/api/spin/watch-ad', {
    method: 'POST',
    body: JSON.stringify({ userId }),
    headers: { 'Content-Type': 'application/json' },
  });
};



export const getSpinHistory = async (userId: number, limit: number = 20): Promise<{
  success: boolean;
  history: Array<{
    prize_label: string;
    prize_type: string;
    prize_value: number;
    created_at: string;
  }>;
  total: number;
}> => {
  return apiFetch(`/api/spin/history?userId=${userId}&limit=${limit}`);
};






// In your api.ts file
export const buySpins = async (data: {
  packageId: string;
  paymentMethod: 'COINS' | 'TON' | 'TON_BLOCKCHAIN';
  userId: string;
  transactionHash?: string;
}) => {
  try {
    console.log('Sending buySpins request:', data);
    
    const response = await apiFetch<any>('/api/spin/buy', {
      method: 'POST',
      body: JSON.stringify({
        packageId: data.packageId,
        paymentMethod: data.paymentMethod,
        userId: data.userId,
        transactionHash: data.transactionHash
      })
    });

    console.log('Raw buySpins response:', response);
    return response;
    
  } catch (error: any) {
    console.error('Buy spins error:', error);
    return { 
      success: false, 
      message: error.data?.message || error.message || 'Network error'
    };
  }
};


// services/api.ts
// services/api.ts
export const executeWithdrawal = async (
  amount: number,
  userId: number
): Promise<{
  success: boolean;
  message: string;
  user?: User;
  transactionId?: number;
}> => {
  return apiFetch('/api/withdraw/ton', {
    method: 'POST',
    body: JSON.stringify({ 
      amount,
      userId,
    }),
  });
};

export const updateWithdrawalTransaction = async (
  transactionId: number,
  transactionHash: string
): Promise<{ success: boolean }> => {
  return apiFetch('/api/withdraw/update-transaction', {
    method: 'POST',
    body: JSON.stringify({ transactionId, transactionHash }),
  });
};



































// export const depositAdCredit = async (
//   amount: number
// ): Promise<{ success: boolean; user: User }> => {
//   // Step 1: Get the current user
//   const res = await getCurrentUserAPI();
//   if (!res.success || !res.user) {
//     throw new Error(res.message || 'Failed to fetch user');
//   }

//   const userId = res.user.id;
//   const newAdCredit = res.user.ad_credit + amount;

//   // Step 2: Make PUT request to update ad_credit using apiFetch
//   const updatedUser = await apiFetch<User>(`/admin/users/${userId}`, {
//     method: 'PUT',
//     body: JSON.stringify({
//       ad_credit: newAdCredit,
//     }),
//   });

//   // Step 3: Update local transaction history
//   transactions.unshift({
//     id: `d${Date.now()}`,
//     type: 'Deposit',
//     amount: amount,
//     currency: 'TON',
//     date: new Date().toISOString().split('T')[0],
//     status: 'Completed',
//   });

//   return {
//     success: true,
//     user: updatedUser,
//   };
// };




// export const fetchUser = async (): Promise<User> => {
//   await simulateDelay();

//   const user = users[0];
//   if (!user.spaceDefenderProgress) {
//     user.spaceDefenderProgress = { ...INITIAL_USER.spaceDefenderProgress };
//   }
//   if (!user.streetRacingProgress) {
//     user.streetRacingProgress = { ...INITIAL_USER.streetRacingProgress };
//   }


//   return { ...user };
// };

// export const fetchDailyTasks = async (): Promise<DailyTask[]> => {
//   await simulateDelay();
//   return [...dailyTasks];
// };

// export const fetchGameTasks = async (): Promise<GameTask[]> => {
//   await simulateDelay();
//   // This is now mapped from the userCampaigns store for consistency
//   return gameTasks.map(c => ({
//       id: c.id,
//       icon: ICONS.game,
//       title: 'Play ' + (new URL(c.link).hostname),
//       reward: (c.cost / (c.goal || 1)) * 0.4 * CONVERSION_RATE,
//   }));
// };

export const fetchQuests = async (): Promise<Quest[]> => {
  await simulateDelay();
  return [...quests];
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  await simulateDelay(800);
  return [...transactions];
};

// export const fetchFriends = async (): Promise<Friend[]> => {
//   await simulateDelay(300);
//   return [...MOCK_FRIENDS];
// };

export const fetchUserCampaigns = async (): Promise<UserCampaign[]> => {
    await simulateDelay(600);
    return [...userCampaigns];
};

export const fetchPartnerCampaigns = async (): Promise<PartnerCampaign[]> => {
    await simulateDelay(700);
    return [...partnerCampaigns];
};

export const addUserCampaign = async (campaignData: {link: string; goal: number; cost: number;}): Promise<{ success: boolean; message: string; newCampaign?: UserCampaign; user?: User; }> => {
    await simulateDelay(1000);

    if (users[0].ad_credit < campaignData.cost) {
        return { success: false, message: "Insufficient ad balance. Please add funds." };
    }

    users[0].ad_credit -= campaignData.cost;
    const newCampaign: UserCampaign = {
        id: `uc${Date.now()}`,
        link: campaignData.link,
        status: 'Active',
        completions: 0,
        goal: campaignData.goal,
        cost: campaignData.cost,
        category: 'Social'
    };
    userCampaigns.unshift(newCampaign);
    socialTasks.unshift(newCampaign);
    return { success: true, message: 'Campaign created successfully!', newCampaign, user: { ...users[0] } };
};

export const addPartnerTask = async (campaignData: { link: string; goal: number; cost: number; level: number }): Promise<{ success: boolean; message: string; newCampaign?: PartnerCampaign; user?: User; }> => {
    await simulateDelay(1000);
    if (users[0].ad_credit < campaignData.cost) {
        return { success: false, message: "Insufficient ad balance. Please add funds." };
    }
    users[0].ad_credit -= campaignData.cost;
    const newCampaign: PartnerCampaign = {
        id: `pc${Date.now()}`,
        link: campaignData.link,
        status: 'Active',
        completions: 0,
        goal: campaignData.goal,
        cost: campaignData.cost,
        requiredLevel: campaignData.level
    };
    partnerCampaigns.unshift(newCampaign);
    return { success: true, message: 'Partner task created successfully!', newCampaign, user: { ...users[0] } };
};


// export const claimDailyTask = async (taskId: string): Promise<{ success: boolean; user: User | null }> => {
//   await simulateDelay();
//   const taskIndex = dailyTasks.findIndex(t => t.id === taskId);
//   if (taskIndex !== -1 && !dailyTasks[taskIndex].claimed) {
//     users[0].coins += dailyTasks[taskIndex].reward;
//     dailyTasks[taskIndex].claimed = true;
    
//     // Grant a spin for completing a task
//     if (users[0].tasksCompletedTodayForSpin < 50) {
//       users[0].spins += 1;
//       users[0].tasksCompletedTodayForSpin += 1;
//     }

//     return { success: true, user: { ...users[0] } };
//   }
//   return { success: false, user: null };
// };

// export const claimReferralEarnings = async (): Promise<{ success: boolean; user: User | null }> => {
//     await simulateDelay();
//     if(users[0].referralEarnings > 0) {
//         users[0].coins += users[0].referralEarnings;
//         users[0].referralEarnings = 0;
//         return { success: true, user: { ...users[0] } };
//     }
//     return { success: false, user: null };
// }


export const createAdminTask = async (task: Omit<Task, 'id' | 'icon'>): Promise<{ success: boolean, task?: Task }> => {
    await simulateDelay();
    const newTask: Task = {
        ...task,
        id: `task-${Date.now()}`,
        icon: ICONS.tasks, // Generic icon for admin-added tasks
    };

    switch (task.category) {
        case 'Daily':
            dailyTasks.push({ ...newTask, mandatory: false });
            break;
        case 'Game':
             gameTasks.push({
                id: newTask.id,
                link: 'https://t.me/example_game_bot',
                status: 'Active',
                completions: 0,
                goal: 1, // Simplified
                cost: 0.1, // Simplified
                category: 'Game'
            });
            break;
        case 'Social':
            socialTasks.push({
                id: newTask.id,
                link: 'https://t.me/example_social_channel',
                status: 'Active',
                completions: 0,
                goal: 1, // Simplified
                cost: 0.1, // Simplified
                category: 'Social'
            });
            break;
        case 'Partner':
             partnerCampaigns.push({
                id: newTask.id,
                link: 'https://t.me/example_partner_bot',
                status: 'Active',
                completions: 0,
                goal: 1,
                cost: 1,
                requiredLevel: 5,
                category: 'Game' // Partner tasks are a form of game task
             });
             break;
        default:
            return { success: false };
    }
    return { success: true, task: newTask };
};


// export const spinWheel = async (): Promise<{ success: boolean; prize: { type: string; value: number; label: string; }; user: User }> => {
//     await simulateDelay(100);

//     if (users[0].spins <= 0) {
//       return {
//         success: false,
//         prize: { type: 'ERROR', value: 0, label: 'No spins left' },
//         user: { ...users[0] }
//       };
//     }

//     users[0].spins -= 1;

//     const totalWeight = SPIN_WHEEL_PRIZES.reduce((acc, prize) => acc + prize.weight, 0);
//     let randomWeight = Math.random() * totalWeight;
//     let selectedPrize = SPIN_WHEEL_PRIZES[SPIN_WHEEL_PRIZES.length - 1]; // fallback

//     for (const prize of SPIN_WHEEL_PRIZES) {
//         if (randomWeight < prize.weight) {
//             selectedPrize = prize;
//             break;
//         }
//         randomWeight -= prize.weight;
//     }
    
//     if (selectedPrize.type === 'COINS') {
//         users[0].coins += selectedPrize.value;
//     }

//     return {
//         success: true,
//         prize: selectedPrize,
//         user: { ...users[0] }
//     };
// };

// export const watchAdForSpin = async(): Promise<{success: boolean; message: string; user?: User}> => {
//     await simulateDelay(200);
//     if (users[0].adsWatchedToday >= 50) {
//         return { success: false, message: "Daily limit for ad spins reached." };
//     }
//     users[0].adsWatchedToday += 1;
//     users[0].spins += 1;
//     return { success: true, message: "+1 Spin!", user: { ...users[0] } };
// }

export const completeTask = async(taskId:number,userid:number): Promise<{success: boolean; message: string; user?: User}> => {
    await simulateDelay(50);
     if (users[0].tasksCompletedTodayForSpin >= 50) {
        return { success: false, message: "Daily limit for task spins reached." };
    }
    users[0].tasksCompletedTodayForSpin += 1;
    users[0].spins += 1;
    return { success: true, message: "+1 Spin for completing a task!", user: { ...users[0] } };
}

// export const inviteFriendForSpin = async(): Promise<{success: boolean; message: string; user?: User}> => {
//     await simulateDelay(50);
//      if (users[0].friendsInvitedTodayForSpin >= 50) {
//         return { success: false, message: "Daily limit for friend invite spins reached." };
//     }
//     users[0].friendsInvitedTodayForSpin += 1;
//     users[0].spins += 1;
//     return { success: true, message: "+1 Spin for inviting a friend!", user: { ...users[0] } };
// }

// services/api.ts


export const redeemPromoCode = async (code: string): Promise<{ success: boolean; message: string; user?: User; }> => {
    await simulateDelay(400);
    const promoCode = promoCodes.find(p => p.code.toLowerCase() === code.toLowerCase());

    if (!promoCode) {
        return { success: false, message: 'Invalid promo code.' };
    }
    if (promoCode.usedBy.length >= promoCode.maxUses) {
        return { success: false, message: 'This promo code has reached its usage limit.' };
    }
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
        return { success: false, message: 'This promo code has expired.' };
    }
    if (promoCode.usedBy.includes(users[0].id)) {
        return { success: false, message: 'You have already used this promo code.' };
    }

    let rewardMessage = '';
    switch (promoCode.type) {
        case 'COINS':
            users[0].coins += promoCode.value;
            rewardMessage = `${promoCode.value.toLocaleString()} Coins`;
            break;
        case 'SPINS':
            users[0].spins += promoCode.value;
            rewardMessage = `${promoCode.value} free spin(s)`;
            break;
        case 'TON_AD_CREDIT':
            users[0].ad_credit += promoCode.value;
            rewardMessage = `${promoCode.value} TON in ad credits`;
            break;
    }

    promoCode.usedBy.push(users[0].id);
    
    return {
        success: true,
        message: `Successfully redeemed! You received ${rewardMessage}.`,
        user: { ...users[0] }
    };
};

// --- Admin-facing API ---

export const adminLogin = async (username: string, password: string): Promise<{ success: boolean, token?: string }> => {
    await simulateDelay();
    const admin = admins.find(a => a.username === username && a.password === password);
    if (admin) {
        return { success: true, token: `mock_token_${admin.id}` };
    }
    return { success: false };
};

export const fetchDashboardStats = async () => {
    await simulateDelay();
    const totalUsers = users.length;
    const totalCoins = users.reduce((acc, u) => acc + u.coins, 0);
    const totalWithdrawals = transactions.filter(t => t.type === 'Withdrawal').reduce((acc, t) => acc + t.amount, 0);
    const tasksCompleted = dailyTasks.filter(t => t.claimed).length;
    return { totalUsers, totalCoins, totalWithdrawals, tasksCompleted };
};

// export const fetchAllUsers = async (): Promise<User[]> => {
//     await simulateDelay();
//     return [...users];
// };

// export const updateUser = async (userId: number, data: Partial<User>): Promise<{ success: boolean, user?: User }> => {
//     await simulateDelay();
//     const userIndex = users.findIndex(u => u.id === userId);
//     if (userIndex !== -1) {
//         users[userIndex] = { ...users[userIndex], ...data };
//         return { success: true, user: users[userIndex] };
//     }
//     return { success: false };
// };

export const fetchAllPromoCodes = async (): Promise<PromoCode[]> => {
    await simulateDelay();
    return [...promoCodes];
};

export const createPromoCode = async (data: Omit<PromoCode, 'usedBy'>): Promise<{ success: boolean, code?: PromoCode }> => {
    await simulateDelay();
    if (promoCodes.some(p => p.code.toLowerCase() === data.code.toLowerCase())) {
        return { success: false };
    }
    const newCode = { ...data, usedBy: [] };
    promoCodes.unshift(newCode);
    return { success: true, code: newCode };
};

// export const fetchSettings = async () => {
//     await simulateDelay();
//     return { ...settings, admins: [...admins] };
// };

// export const updateSettings = async (newSettings: Partial<typeof settings>): Promise<{ success: boolean, settings?: typeof settings }> => {
//     await simulateDelay();
//     settings = { ...settings, ...newSettings };
//     return { success: true, settings: { ...settings }};
// };


