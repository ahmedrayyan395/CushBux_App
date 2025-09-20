import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMPLETION_TIERS } from '../constants';
import type { CompletionTier, UserCampaign, User } from '../types';
import { fetchUserCampaigns, depositAdCreditAPI, fetchUserCampaignsAPI, addUserCampaignAPI } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';

interface MyTasksComponentProps {
  userid: number;
}
const MyTasksComponent: React.FC<MyTasksComponentProps> = ({ userid }) => {
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
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
        <p className="text-center text-slate-400 py-10">You haven't created any tasks yet.</p>
      ) : (
        campaigns.map(campaign => (
          <div key={campaign.id} className="bg-slate-800 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-semibold truncate pr-4">{campaign.link}</p>
                {campaign.title && <p className="text-slate-400 text-sm mt-1">{campaign.title}</p>}
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyles[campaign.status]}`}>{campaign.status}</span>
            </div>
            <div>
              <ProgressBar current={campaign.completions} total={campaign.goal} />
              <div className="flex justify-between text-sm text-slate-400 mt-1">
                <span>{campaign.completions.toLocaleString()} / {campaign.goal.toLocaleString()}</span>
                <span> Spent: {Number(campaign.cost).toFixed(2)} TON</span>
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button className="w-full bg-slate-700 text-white font-semibold py-2 rounded-lg text-sm hover:bg-slate-600 transition-colors">Add Funds</button>
              <button disabled={campaign.status !== 'Completed'} className="w-full bg-green-500 text-white font-semibold py-2 rounded-lg text-sm hover:bg-green-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">Re-activate</button>
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
                {(user?.ad_credit || 0).toFixed(2)} <span className="text-lg font-medium text-green-400">TON</span>
            </p>
        </div>
        <button
            onClick={onAddFunds}
            className="bg-green-500 text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors hover:bg-green-600"
        >
            Add Funds
        </button>
    </section>
);

const ValidationInstructions: React.FC<{
  category: string;
  checkSubscription: boolean;
}> = ({ category, checkSubscription }) => {
  if (category === 'Social' && checkSubscription) {
    return (
      <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-lg mt-4">
        <h4 className="text-blue-400 font-semibold mb-2">📋 Validation Instructions for Social Tasks</h4>
        <p className="text-blue-300 text-sm">
          To validate user subscriptions, you need to:
        </p>
        <ol className="list-decimal list-inside text-blue-300 text-sm mt-2 space-y-1">
          <li>Add our bot <span className="font-mono">@YourValidationBot</span> as an admin to your channel/group</li>
          <li>Grant the bot permission to view members</li>
          <li>Ensure the bot has access to see who joins/leaves</li>
          <li>Users will only get rewards after we verify their subscription</li>
        </ol>
      </div>
    );
  } else if (category === 'Game') {
    return (
      <div className="bg-purple-900/20 border border-purple-700/50 p-4 rounded-lg mt-4">
        <h4 className="text-purple-400 font-semibold mb-2">🎮 Validation Instructions for Game Tasks</h4>
        
  <div className="bg-purple-900/20 border border-purple-700/50 p-4 rounded-lg mt-4">
    <h4 className="text-purple-400 font-semibold mb-2">Bot Task</h4>
    <p className="text-purple-300 text-sm">
      Users must start your bot using a deep link. Example:
    </p>
    <code className="text-purple-200 text-xs bg-purple-800 p-1 rounded block mt-1">
      https://t.me/yourbot?start=ref_Text
    </code>
    <p className="text-purple-300 text-xs mt-2">
      Make sure your bot can handle start commands.
    </p>
  </div>

      </div>
    );
  }
  
  return null;
};

const AddTaskFormComponent: React.FC<{
    taskLink: string;
    setTaskLink: (value: string) => void;
    campaignTitle: string;
    setCampaignTitle: (value: string) => void;
    checkSubscription: boolean;
    setCheckSubscription: (value: boolean) => void;
    selectedTier: CompletionTier | null;
    setSelectedTier: (tier: CompletionTier) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
}> = ({ taskLink, setTaskLink, campaignTitle, setCampaignTitle, checkSubscription, setCheckSubscription, selectedTier, setSelectedTier, selectedCategory, setSelectedCategory }) => {
    return (
        <div className="space-y-6">
            {/* Category Selection */}
            <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-300">Task Category</h3>
                <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setSelectedCategory('Social')} 
                        className={`w-full p-2 rounded-lg font-semibold transition-colors duration-200 ${selectedCategory === 'Social' ? 'bg-green-500 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
                    >
                        Social
                    </button>
                    <button 
                        onClick={() => setSelectedCategory('Game')} 
                        className={`w-full p-2 rounded-lg font-semibold transition-colors duration-200 ${selectedCategory === 'Game' ? 'bg-green-500 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
                    >
                        Game
                    </button>
                </div>
            </section>

            {/* Campaign Title input */}
            <section className="space-y-2">
                <label htmlFor="campaign-title" className="text-base font-semibold text-slate-300">
                    Campaign Title (in any language)
                </label>
                <input
                    id="campaign-title"
                    type="text"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Enter a title for your campaign"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
            </section>

            {/* Link input */}
            <section className="space-y-2">
                <label htmlFor="task-link" className="text-base font-semibold text-slate-300">
                    {selectedCategory === 'Social' ? 'Link to your channel/group' : 'Link to your bot'}
                </label>
                <input
                    id="task-link"
                    type="text"
                    value={taskLink}
                    onChange={(e) => setTaskLink(e.target.value)}
                    placeholder={selectedCategory === 'Social' ? 'https://t.me/yourchannel' : 'https://t.me/yourbot'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
            </section>

            {/* Check subscription (only for Social) */}
            {selectedCategory === 'Social' && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-300">Check subscription?</h3>
                        <div className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-500 text-slate-500 font-bold text-sm">?</div>
                    </div>
                    <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl">
                        <button onClick={() => setCheckSubscription(false)} className={`w-full p-2 rounded-lg font-semibold transition-colors duration-200 ${!checkSubscription ? 'bg-green-500 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}>
                            No
                        </button>
                        <button onClick={() => setCheckSubscription(true)} className={`w-full p-2 rounded-lg font-semibold transition-colors duration-200 ${checkSubscription ? 'bg-green-500 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}>
                            Yes <span className="text-xs">(+30%)</span>
                        </button>
                    </div>
                </section>
            )}

            {/* Number of task completions */}
            <section className="space-y-3">
                <h3 className="text-base font-semibold text-slate-300">Number of task completions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMPLETION_TIERS.map(tier => (
                  <button key={tier.completions} onClick={() => setSelectedTier(tier)} className={`p-2 rounded-lg border-2 font-semibold text-base transition-all ${selectedTier?.completions === tier.completions ? 'bg-green-500 border-green-500' : 'bg-slate-800 border-slate-700 hover:border-green-500'}`}>
                    {tier.completions >= 1000 ? `${tier.completions / 1000}k` : tier.completions}
                  </button>
                ))}
              </div>
            </section>

            {/* Validation Instructions */}
            <ValidationInstructions category={selectedCategory} checkSubscription={checkSubscription} />
        </div>
    );
};

interface NewTaskPageProps {
  user: User | null;
  setUser: (user: User) => void;
}

const NewTaskPage: React.FC<NewTaskPageProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'add' | 'my'>('add');
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  
  // Form state
  const [taskLink, setTaskLink] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [checkSubscription, setCheckSubscription] = useState(false);
  const [selectedTier, setSelectedTier] = useState<CompletionTier | null>(COMPLETION_TIERS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Social');
  const [totalCost, setTotalCost] = useState(0);

  // Control State
  const [isProcessing, setIsProcessing] = useState(false);
  const [campaignsVersion, setCampaignsVersion] = useState(0);

  useEffect(() => {
    if (selectedTier) {
      const baseCost = selectedTier.cost;
      const subscriptionCost = (selectedCategory === 'Social' && checkSubscription) ? baseCost * 0.30 : 0;
      const finalCost = baseCost + subscriptionCost;
      setTotalCost(finalCost);
    } else {
        setTotalCost(0);
    }
  }, [selectedTier, checkSubscription, selectedCategory]);
  
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
  const formIsValid = selectedTier && taskLink.startsWith('https://t.me/') && taskLink.length > 15 && campaignTitle.trim().length > 0;
  const canAfford = adBalance >= totalCost;
  
  const handleCreateCampaign = async () => {
      if (isProcessing || !formIsValid || !selectedTier || !canAfford) return;
      
      setIsProcessing(true);
      try {
        const result = await addUserCampaignAPI({
        userid: user.id,
        link: taskLink,
        title: campaignTitle.trim(),
        goal: selectedTier.completions,
        cost: totalCost,
        category: selectedCategory,
        checkSubscription: selectedCategory === 'Social' ? checkSubscription : false,
      });


          if (result.success && result.user) {
              alert(result.message);
              setUser(result.user);
              // Reset form
              setTaskLink('');
              setCampaignTitle('');
              setCheckSubscription(false);
              setSelectedTier(COMPLETION_TIERS[0]);
              setSelectedCategory('Social');
              // Switch tab and trigger refresh
              setActiveTab('my');
              setCampaignsVersion(v => v + 1);
          } else {
              alert(result.message || 'Campaign creation failed. Please try again.');
          }
      } catch (error) {
          console.error('Campaign creation error:', error);
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
            <h1 className="text-lg font-bold">{activeTab === 'add' ? 'Add Task' : 'My Tasks'}</h1>
        </div>
        <div className="w-24 text-right">
          <button className="p-2 rounded-full hover:bg-slate-700" aria-label="More options">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white"><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/></svg>
          </button>
        </div>
      </header>
      
      {/* Main Content with Tabs */}
      <main className="pt-20 pb-28 px-4">
        {/* Tabs */}
        <div className="bg-slate-800 p-1 rounded-xl flex items-center mb-6">
            <button onClick={() => setActiveTab('add')} className={`w-1/2 p-2 rounded-lg font-bold transition-colors ${activeTab === 'add' ? 'bg-green-500 text-white' : 'text-slate-300'}`}>
                Add Task
            </button>
            <button onClick={() => setActiveTab('my')} className={`w-1/2 p-2 rounded-lg font-bold transition-colors ${activeTab === 'my' ? 'bg-green-500 text-white' : 'text-slate-300'}`}>
                My Tasks
            </button>
        </div>
        
        {/* Conditional Content */}
        {activeTab === 'add' ? (
            <>
              <AdBalanceDisplay user={user} onAddFunds={handleAddFunds} />

              <AddTaskFormComponent 
                  taskLink={taskLink}
                  setTaskLink={setTaskLink}
                  campaignTitle={campaignTitle}
                  setCampaignTitle={setCampaignTitle}
                  checkSubscription={checkSubscription}
                  setCheckSubscription={setCheckSubscription}
                  selectedTier={selectedTier}
                  setSelectedTier={setSelectedTier}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
              />
            </>
        ) : (
            <MyTasksComponent key={campaignsVersion} userid={user.id}/>
        )}
      </main>
      

      {/* Fixed Footer for Add Task */}
      {activeTab === 'add' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-slate-800 p-4 border-t border-slate-700">
          <button 
            onClick={handleCreateCampaign}
            className="w-full bg-green-500 text-white font-bold py-4 rounded-lg text-lg hover:bg-green-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed" 
            disabled={!formIsValid || isProcessing || !canAfford}>
            {getButtonText()}
          </button>
        </footer>
      )}
    </div>
  );
};

export default NewTaskPage;