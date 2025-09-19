import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMPLETION_TIERS, LANGUAGE_OPTIONS } from '../constants';
import type { CompletionTier, LanguageOption, PartnerCampaign, User } from '../types';
import { addPartnerTask, fetchPartnerCampaigns, depositAdCreditAPI, addUserCampaignAPI, fetchUserCampaignsAPI } from '../services/api';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import ProgressBar from '../components/ProgressBar';


interface MyTasksComponentProps {
  userid: number;
}

const MyPartnerTasksComponent:  React.FC<MyTasksComponentProps> = ({ userid }) => {
  const [campaigns, setCampaigns] = useState<PartnerCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCampaignsAPI(userid).then(data => {
      setCampaigns(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center text-slate-400 py-10">Loading campaigns...</div>;
  }
  
  const statusStyles = {
    Active: 'bg-green-500/20 text-green-400',
    Paused: 'bg-yellow-500/20 text-yellow-400',
    Completed: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="space-y-4">
      {campaigns.length === 0 ? (
        <p className="text-center text-slate-400 py-10">You haven't created any partner tasks yet.</p>
      ) : (
        campaigns.map(campaign => (
          <div key={campaign.id} className="bg-slate-800 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <p className="text-white font-semibold truncate pr-4">{campaign.link}</p>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyles[campaign.status]}`}>{campaign.status}</span>
            </div>
            <div className="text-sm text-slate-300">Required Level: <span className="font-bold text-white">{campaign.requiredLevel}</span></div>
            
            {/* Webhook Token Display */}
            {campaign.webhookToken && (
              <div className="bg-blue-900/20 p-3 rounded">
                <p className="text-blue-300 text-xs font-semibold mb-1">Webhook Token:</p>
                <code className="text-blue-200 text-xs break-all bg-blue-800/50 p-1 rounded">
                  {campaign.webhookToken}
                </code>
                <p className="text-blue-300 text-xs mt-1">
                  Use this token to authenticate level updates from your game
                </p>
              </div>
            )}

            <div>
              <ProgressBar current={campaign.completions} total={campaign.goal} />
              <div className="flex justify-between text-sm text-slate-400 mt-1">
                <span>{campaign.completions.toLocaleString()} / {campaign.goal.toLocaleString()}</span>
                <span>Spent:{Number(campaign.cost).toFixed(2)} TON</span>
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button className="w-full bg-slate-700 text-white font-semibold py-2 rounded-lg text-sm hover:bg-slate-600 transition-colors">Add Funds</button>
              <button disabled={campaign.status !== 'Completed'} className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">Re-activate</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const AdBalanceDisplay: React.FC<{
    user: User | null;
    onAddFunds: () => void;
}> = ({ user, onAddFunds }) => (
    <section className="bg-slate-800 p-4 rounded-lg flex items-center justify-between mb-6">
        <div>
            <h3 className="text-sm font-semibold text-slate-400">Your Ad Balance</h3>
            <p className="text-2xl font-bold text-white">
                {(user?.ad_credit || 0).toFixed(2)} <span className="text-lg font-medium text-blue-400">TON</span>
            </p>
        </div>
        <button
            onClick={onAddFunds}
            className="bg-blue-500 text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors hover:bg-blue-600"
        >
            Add Funds
        </button>
    </section>
);

const PartnerInstructions: React.FC = () => (
  <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-lg mt-4">
    <h4 className="text-blue-400 font-semibold mb-2">🎯 Level Validation Setup</h4>
    <p className="text-blue-300 text-sm mb-3">
      For level validation to work, your game must send progress updates to our webhook:
    </p>
    
    <div className="bg-blue-800/50 p-2 rounded mb-3">
      <code className="text-blue-200 text-sm break-all">
        POST /api/webhook/level-update
      </code>
    </div>
    
    <ol className="list-decimal list-inside text-blue-300 text-sm space-y-2">
      <li>Include the webhook token in Authorization header: <code className="bg-blue-800 px-1 rounded">Bearer YOUR_TOKEN</code></li>
      <li>Send JSON with: <code className="bg-blue-800 px-1 rounded">user_id</code> and <code className="bg-blue-800 px-1 rounded">current_level</code></li>
      <li>We'll automatically track user progress</li>
      <li>Users can claim rewards when they reach your required level</li>
    </ol>
    
    <div className="mt-3 p-2 bg-blue-800/30 rounded">
      <p className="text-blue-200 text-xs">
        🔗 <strong>Webhook required</strong> for level validation to work
      </p>
    </div>
  </div>
);

const AddPartnerTaskFormComponent: React.FC<{
    taskLink: string;
    setTaskLink: (value: string) => void;
    selectedLevel: number;
    setSelectedLevel: (level: number) => void;
    selectedTier: CompletionTier | null;
    setSelectedTier: (tier: CompletionTier) => void;
    selectedLanguages: string[];
    setSelectedLanguages: (langs: string[]) => void;
}> = ({ taskLink, setTaskLink, selectedLevel, setSelectedLevel, selectedTier, setSelectedTier, selectedLanguages, setSelectedLanguages }) => {

    const handleLanguageToggle = (langId: string) => {
        const newSelection = [...selectedLanguages];
        const index = newSelection.indexOf(langId);
        if (index > -1) {
            if (newSelection.length > 1 && langId !== 'en') {
                newSelection.splice(index, 1);
            }
        } else {
            newSelection.push(langId);
        }
        setSelectedLanguages(newSelection);
    };

    return (
        <div className="space-y-6">
            {/* Link input */}
            <section className="space-y-2">
                <label htmlFor="task-link" className="text-base font-semibold text-slate-300">Link to your game/bot</label>
                <input
                    id="task-link"
                    type="text"
                    value={taskLink}
                    onChange={(e) => setTaskLink(e.target.value)}
                    placeholder="https://t.me/yourgamebot"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
            </section>
            
            {/* Level selection */}
            <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-300">Required Level <span className="text-xs text-slate-400">(Cost x Level)</span></h3>
                <div className="grid grid-cols-5 gap-2">
                {[...Array(10).keys()].map(i => i + 1).map(level => (
                  <button key={level} onClick={() => setSelectedLevel(level)} className={`p-2 rounded-lg border-2 font-semibold text-base transition-all ${selectedLevel === level ? 'bg-blue-500 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-blue-500'}`}>
                    {level}
                  </button>
                ))}
              </div>
            </section>

            {/* Number of task completions */}
            <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-300">Number of task completions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMPLETION_TIERS.map(tier => (
                  <button key={tier.completions} onClick={() => setSelectedTier(tier)} className={`p-2 rounded-lg border-2 font-semibold text-base transition-all ${selectedTier?.completions === tier.completions ? 'bg-blue-500 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-blue-500'}`}>
                    {tier.completions >= 1000 ? `${tier.completions / 1000}k` : tier.completions}
                  </button>
                ))}
              </div>
            </section>
            
            {/* Language Selection */}
            <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-300">Languages <span className="text-xs text-slate-400">(+15% for each extra)</span></h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LANGUAGE_OPTIONS.map(lang => (
                        <button key={lang.id} onClick={() => handleLanguageToggle(lang.id)} className={`p-2 rounded-lg border-2 font-semibold text-base transition-all ${selectedLanguages.includes(lang.id) ? 'bg-blue-500 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-blue-500'}`} disabled={lang.id === 'en' && selectedLanguages.includes('en') && selectedLanguages.length === 1}>
                            {lang.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* Webhook Instructions */}
            <PartnerInstructions />
        </div>
    );
};

interface NewPartnerTaskPageProps {
  user: User | null;
  setUser: (user: User) => void;
}

const NewPartnerTaskPage: React.FC<NewPartnerTaskPageProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'add' | 'my'>('add');
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  
  // Form state
  const [taskLink, setTaskLink] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedTier, setSelectedTier] = useState<CompletionTier | null>(COMPLETION_TIERS[0]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [totalCost, setTotalCost] = useState(0);

  // Control State
  const [isProcessing, setIsProcessing] = useState(false);
  const [campaignsVersion, setCampaignsVersion] = useState(0);

  useEffect(() => {
    if (selectedTier) {
        const PARTNER_MULTIPLIER = 10;
        const baseCost = selectedTier.cost;
        const partnerBaseCost = baseCost * PARTNER_MULTIPLIER;
        const levelAdjustedCost = partnerBaseCost * selectedLevel;

        const extraLanguages = selectedLanguages.includes('en') ? selectedLanguages.length - 1 : selectedLanguages.length;
        const languageCost = levelAdjustedCost * extraLanguages * 0.15;
        
        const finalCost = levelAdjustedCost + languageCost;
        setTotalCost(finalCost);
    } else {
        setTotalCost(0);
    }
  }, [selectedTier, selectedLevel, selectedLanguages]);

 const MERCHANT_WALLET_ADDRESS = "UQCUj1nsD2CHdyBoO8zIUqwlL-QXpyeUsMbePiegTqURiJu0";
 
   const handleAddFunds = async () => {
   if (!wallet) {
     tonConnectUI.openModal();
     return;
   }
 
   const amountStr = prompt("How much TON would you like to deposit to your ad balance?", "1");
   if (amountStr) {
     const amount = parseFloat(amountStr);
     if (!isNaN(amount) && amount > 0) {
       try {
         // Execute blockchain transaction
         const transaction = {
           validUntil: Math.floor(Date.now() / 1000) + 300,
           messages: [
             {
               address: MERCHANT_WALLET_ADDRESS,
               amount: Math.round(amount * 1e9).toString(), // Convert to nanoton
             },
           ],
         };
 
         // Show loading state
         alert(`Please complete the ${amount} TON deposit in your wallet...`);
 
         // Send transaction without waiting for it to complete
         tonConnectUI.sendTransaction(transaction)
           .then(async (resultBoc) => {
             if (resultBoc?.boc) {
               // Process successful transaction
               const result = await depositAdCreditAPI(user.id, amount, resultBoc.boc);
 
               if (result.success) {
                 setUser(result.user);
                 alert("Deposit successful! Your balance has been updated.");
               } else {
                 alert("Deposit failed: " + (result.message || "Unknown error"));
               }
             }
           })
           .catch((error) => {
             console.error('Transaction error:', error);
             alert("Transaction failed or was cancelled: " + error.message);
           });
       } catch (error) {
         console.error('Deposit initiation error:', error);
         alert("Failed to initiate deposit");
       }
     } else {
       alert("Invalid amount entered.");
     }
   }
 };

  const adBalance = user?.ad_credit || 0;
  const formIsValid = selectedTier && taskLink.startsWith('https://t.me/') && taskLink.length > 15 && selectedLanguages.length > 0;
  const canAfford = adBalance >= totalCost;
  let category='Partner';
  
  const handleCreateCampaign = async () => {
      if (isProcessing || !formIsValid || !selectedTier || !canAfford) return;
      
      setIsProcessing(true);
      try {
          const result = await addUserCampaignAPI({
             userid: user.id,
             link: taskLink,
             goal: selectedTier.completions,
             cost: totalCost,
             level: selectedLevel,
             category: category,
             languages: selectedLanguages,
          });

          if (result.success && result.user) {
              alert("Partner task created successfully! Check 'My Tasks' for your webhook token.");
              setUser(result.user);
              // Reset form
              setTaskLink('');
              setSelectedLevel(1);
              setSelectedTier(COMPLETION_TIERS[0]);
              setSelectedLanguages(['en']);
              // Switch tab and trigger refresh
              setActiveTab('my');
              setCampaignsVersion(v => v + 1);
          } else {
              alert(result.message || 'Campaign creation failed. Please try again.');
          }
      } catch (error) {
          console.error('Partner task creation error:', error);
          alert('An unexpected error occurred during campaign creation.');
      } finally {
          setIsProcessing(false);
      }
  };
  
  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    return `Pay ${totalCost.toFixed(2)} TON`;
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {/* Custom Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm z-40 p-4 border-b border-slate-700/50 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center font-semibold text-white w-24">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back
        </button>
        <div className="text-center">
            <h1 className="text-lg font-bold">{activeTab === 'add' ? 'Add Partner Task' : 'My Partner Tasks'}</h1>
        </div>
        <div className="w-24 text-right">
            <button className="p-2 rounded-full hover:bg-slate-700" aria-label="More options">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white"><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/></svg>
            </button>
        </div>
      </header>
      
      <main className="pt-20 pb-28 px-4">
        {/* Tabs */}
        <div className="bg-slate-800 p-1 rounded-xl flex items-center mb-6">
            <button onClick={() => setActiveTab('add')} className={`w-1/2 p-2 rounded-lg font-bold transition-colors ${activeTab === 'add' ? 'bg-blue-500 text-white' : 'text-slate-300'}`}>
                Add Task
            </button>
            <button onClick={() => setActiveTab('my')} className={`w-1/2 p-2 rounded-lg font-bold transition-colors ${activeTab === 'my' ? 'bg-blue-500 text-white' : 'text-slate-300'}`}>
                My Tasks
            </button>
        </div>
        
        {activeTab === 'add' ? (
            <>
              <AdBalanceDisplay user={user} onAddFunds={handleAddFunds} />
              <AddPartnerTaskFormComponent 
                  taskLink={taskLink}
                  setTaskLink={setTaskLink}
                  selectedLevel={selectedLevel}
                  setSelectedLevel={setSelectedLevel}
                  selectedTier={selectedTier}
                  setSelectedTier={setSelectedTier}
                  selectedLanguages={selectedLanguages}
                  setSelectedLanguages={setSelectedLanguages}
              />
            </>
        ) : (
            <MyPartnerTasksComponent key={campaignsVersion} userid={user.id}/>
        )}
      </main>

      {activeTab === 'add' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-slate-800 p-4 border-t border-slate-700">
          <button 
            onClick={handleCreateCampaign}
            className="w-full bg-blue-500 text-white font-bold py-4 rounded-lg text-lg hover:bg-blue-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed" 
            disabled={!formIsValid || isProcessing || !canAfford}>
            {getButtonText()}
          </button>
        </footer>
      )}
    </div>
  );
};

export default NewPartnerTaskPage;