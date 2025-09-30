// LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminLogin } from '../../services/api';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await adminLogin(username, password);

    if (result.success && result.token && result.user) {
      onLogin();
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">CashuBux Admin</h1>
          <p className="mt-2 text-slate-400">Sign in to your account</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
            System Users
          </h3>
          <p className="text-xs text-slate-400">
            Use your registered username and password to access the admin panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;