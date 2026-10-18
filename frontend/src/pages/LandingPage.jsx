import React from 'react';
import {
  Activity,
  Cpu,
  MapPin,
  Truck,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  Database,
  Radio,
} from 'lucide-react';

export const LandingPage = ({ onNavigateToLogin, onNavigateToRegister }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-[600px] -left-40 w-[500px] h-[500px] bg-emerald-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-[800px] -right-40 w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25 hover:rotate-6 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">EcoNexa</span>
            <span className="text-emerald-400 font-extrabold text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 tracking-wider">
              AI 2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToLogin}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition"
          >
            Sign In
          </button>
          <button
            onClick={onNavigateToRegister}
            className="btn-interactive px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-12 py-20 lg:py-28 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8 shadow-inner shadow-emerald-500/10">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          Next-Generation Municipal Waste Intelligence
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-5xl leading-[1.1]">
          Predictive Bin Fill Telemetry &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Automated Route Optimization
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed">
          Empowering smart municipalities with real-time IoT fill telemetry, Scikit-Learn machine learning
          predictions, and heuristic TSP collection routing to eliminate overflowing bins and cut emissions.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onNavigateToLogin}
            className="btn-interactive px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base transition shadow-xl shadow-emerald-500/30 flex items-center gap-2"
          >
            Launch System Portal <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToLogin}
            className="btn-interactive px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base border border-slate-700/80 transition shadow-sm"
          >
            Explore Demo Roles
          </button>
        </div>

        {/* Live System Stats Pill with hover lift */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl pt-8 border-t border-slate-800/80">
          <div className="card-hover p-4 rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 group">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 group-hover:scale-105 transition-transform inline-block">99.1%</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Prediction Accuracy (R²)</p>
          </div>
          <div className="card-hover p-4 rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 group">
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-400 group-hover:scale-105 transition-transform inline-block">32%</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Collection Fuel Reduction</p>
          </div>
          <div className="card-hover p-4 rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 group">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 group-hover:scale-105 transition-transform inline-block">&lt; 3.0s</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Real-time Telemetry Latency</p>
          </div>
          <div className="card-hover p-4 rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 group">
            <p className="text-2xl sm:text-3xl font-extrabold text-purple-400 group-hover:scale-105 transition-transform inline-block">100%</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Municipal Ward Visibility</p>
          </div>
        </div>
      </section>

      {/* Architecture & Core Features */}
      <section className="px-6 sm:px-12 py-16 bg-slate-950 border-t border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Three Dedicated Operational Workflows</h2>
            <p className="text-sm text-slate-400">Engineered specifically for municipal administrators, monitoring officers, and field collection staff</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-hover p-7 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">Municipal Administrators</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized dashboard with full bin lifecycle management, automated TSP collection dispatch,
                sensor threshold settings, and comprehensive CSV report generation.
              </p>
            </div>

            <div className="card-hover p-7 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">Field Collection Staff</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mobile-optimized task portal with turn-by-turn route sequences, waste tonnage recording,
                before/after fill tracking, and instant damaged bin incident reporting.
              </p>
            </div>

            <div className="card-hover p-7 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Monitoring Officers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Continuous telemetry oversight with Leaflet live maps, automated overflow alert resolution,
                and 6h/12h/24h Scikit-Learn fill forecasting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800/80 px-6 sm:px-12 text-center text-xs text-slate-500 bg-slate-950">
        <p>EcoNexa — Enterprise Intelligent Waste Prediction and Monitoring System &copy; 2026</p>
      </footer>
    </div>
  );
};
