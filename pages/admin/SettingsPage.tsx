import React, { useState, useEffect } from 'react';
import type { AdNetwork } from '../../types';
import { fetchSettings, updateSettings, fetchAdNetworks, addAdNetwork, toggleAdNetwork } from '../../services/api';

const SettingsPage: React.FC = () => {
  const [autoWithdrawals, setAutoWithdrawals] = useState(false);
  const [adNetworks, setAdNetworks] = useState<AdNetwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSettings(), fetchAdNetworks()])
      .then(([settingsData, networks]) => {
        setAutoWithdrawals(settingsData.autoWithdrawals);
        setAdNetworks(networks);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings", err);
        setLoading(false);
      });
  }, []);

  const handleSettingChange = async (value: boolean) => {
    setAutoWithdrawals(value); // optimistic
    try {
      await updateSettings({ autoWithdrawals: value });
    } catch {
      alert("Failed to update autoWithdrawals");
      const latest = await fetchSettings();
      setAutoWithdrawals(latest.autoWithdrawals);
    }
  };

  const handleAdNetworkToggle = async (networkId: string) => {
    const network = adNetworks.find(n => n.id === networkId);
    if (!network) return;
    const updated = { ...network, enabled: !network.enabled };
    setAdNetworks(adNetworks.map(n => (n.id === networkId ? updated : n))); // optimistic
    try {
      await toggleAdNetwork(networkId, updated.enabled);
    } catch {
      alert("Failed to update ad network");
      setAdNetworks(await fetchAdNetworks());
    }
  };

  const handleAddAdNetwork = async (name: string, code: string) => {
    try {
      const newNetwork = await addAdNetwork({ name, code, enabled: true });
      setAdNetworks([...adNetworks, newNetwork]);
    } catch {
      alert("Failed to add ad network");
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Application Settings</h1>

      <div className="space-y-12">
        {/* Withdrawal Settings */}
        <section className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-4">Withdrawal Settings</h2>
          <div className="flex items-center justify-between">
            <p className="text-slate-300">Enable automatic payouts for users?</p>
            <button
              onClick={() => handleSettingChange(!autoWithdrawals)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                autoWithdrawals ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  autoWithdrawals ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            If disabled, all withdrawal requests will require manual approval.
          </p>
        </section>

        {/* Ad Network Settings */}
        <section className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-4">Ad Network Management</h2>
          <div className="space-y-3 mb-6">
            {adNetworks.map(network => (
              <div
                key={network.id}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div>
                  <p className="font-semibold">{network.name}</p>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-xs">
                    {network.code}
                  </p>
                </div>
                <button
                  onClick={() => handleAdNetworkToggle(network.id)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    network.enabled ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                      network.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <AddNetworkForm onAdd={handleAddAdNetwork} />
        </section>
      </div>
    </div>
  );
};

const AddNetworkForm: React.FC<{ onAdd: (name: string, code: string) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name, code);
    setName('');
    setCode('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 pt-4 border-t border-slate-700"
    >
      <h3 className="font-semibold">Add New Ad Network</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Network Name (e.g., AdCompany)"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
          required
        />
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Ad Script/Code Snippet"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg col-span-2"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-600 transition-colors"
      >
        + Add Network
      </button>
    </form>
  );
};

export default SettingsPage;
