import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Shield, Truck, Eye, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage = ({ onNavigateToRegister, onNavigateToLanding }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <button
          onClick={onNavigateToLanding}
          className="inline-flex items-center gap-2 mb-6 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25 group-hover:rotate-6 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">EcoNexa</span>
        </button>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Municipal Operations Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Sign in to access real-time telemetry, AI predictions, and task dispatch
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="card-hover bg-slate-900/80 backdrop-blur-2xl border border-slate-800 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@econexa.city"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-interactive w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Demo Roles
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@econexa.city')}
                className="btn-interactive p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-purple-500/30 text-center text-xs font-semibold text-purple-300 transition flex flex-col items-center gap-1 shadow-sm"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-[10px]">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('staff@econexa.city')}
                className="btn-interactive p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-emerald-500/30 text-center text-xs font-semibold text-emerald-300 transition flex flex-col items-center gap-1 shadow-sm"
              >
                <Truck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px]">Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('officer@econexa.city')}
                className="btn-interactive p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-blue-500/30 text-center text-xs font-semibold text-blue-300 transition flex flex-col items-center gap-1 shadow-sm"
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-[10px]">Officer</span>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-500 mt-2 font-mono">Password: password123</p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            <span>Don't have an account? </span>
            <button
              onClick={onNavigateToRegister}
              className="text-emerald-400 font-bold hover:underline"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
