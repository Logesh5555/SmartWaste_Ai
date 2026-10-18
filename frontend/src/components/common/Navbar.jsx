import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { alertsAPI } from '../../services/api';
import {
  Bell,
  LogOut,
  User,
  Activity,
  Shield,
  Truck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ChevronLeft,
  ChevronRight,
  Home,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar, activePage, setActivePage }) => {
  const { user, logout } = useAuth();
  const { isConnected, latestAlert, clearLatestAlert } = useSocket();
  const [unreadAlerts, setUnreadAlerts] = useState([]);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await alertsAPI.getAll({ resolved: 'false' });
        setUnreadAlerts(res.data.alerts.slice(0, 5));
      } catch (err) {
        // quiet
      }
    };
    if (user) {
      fetchAlerts();
    }
  }, [user, latestAlert]);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case 'officer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
            <Eye className="w-3 h-3" /> Officer
          </span>
        );
      case 'staff':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
            <Truck className="w-3 h-3" /> Municipal Staff
          </span>
        );
    }
  };

  const PAGE_NAMES = {
    dashboard: 'Admin Dashboard',
    'staff-portal': 'Staff Task Portal',
    bins: 'Bin Management',
    'bin-detail': 'Bin Telemetry & Details',
    map: 'Live IoT Telemetry Map',
    predictions: 'AI Fill Predictions',
    scheduling: 'Smart Route Scheduling',
    alerts: 'Active Incident Alerts',
    analytics: 'Analytics & Forecasting',
    users: 'Municipal Staff & Users',
    settings: 'System & Profile Settings',
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoForward = () => {
    window.history.forward();
  };

  const currentPageLabel = PAGE_NAMES[activePage] || 'Dashboard';
  const homeTarget = user?.role === 'staff' ? 'staff-portal' : 'dashboard';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 rounded-xl lg:hidden hover:bg-slate-100 hover:text-slate-800 focus:outline-none transition-colors"
          aria-label="Toggle Navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Direct Back Navigation Button */}
        <button
          onClick={handleGoBack}
          title="Go Back to Previous Page"
          className="p-2 text-slate-600 rounded-xl md:hidden hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5 text-emerald-600" />
        </button>

        {/* App Brand */}
        <div 
          onClick={() => setActivePage && setActivePage(homeTarget)}
          className="flex items-center gap-2.5 group cursor-pointer select-none"
          title="Return to Home Dashboard"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 group-hover:shadow-emerald-600/30 transition-all duration-300">
            <Activity className="w-5 h-5 group-hover:animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
              EcoNexa
            </h1>
            <p className="text-[11px] text-slate-500 hidden xl:block font-medium">
              Intelligent Waste Monitoring
            </p>
          </div>
        </div>

        {/* Navigation History Symbols: Back & Forward buttons */}
        <div className="hidden sm:flex items-center ml-2 pl-3 border-l border-slate-200 gap-1">
          <button
            onClick={handleGoBack}
            title="Navigate Back (Previous Page)"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active:scale-95 group flex items-center justify-center border border-slate-200/70"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={handleGoForward}
            title="Navigate Forward"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active:scale-95 group flex items-center justify-center border border-slate-200/70"
            aria-label="Forward"
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Breadcrumb Navigation Trail */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 ml-1">
          <button
            onClick={() => setActivePage && setActivePage(homeTarget)}
            className="flex items-center gap-1 font-semibold text-slate-600 hover:text-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
            title="Go to Home"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-xs text-[11px]">
            {currentPageLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time telemetry connection pill */}
        <div
          title={isConnected ? 'Telemetry WebSocket connected and transmitting' : 'Attempting to establish telemetry socket'}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-slate-700 transition-all cursor-default"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 telemetry-live-glow animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-slate-400" />
            {isConnected ? 'Telemetry Live' : 'Connecting...'}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105"
            aria-label="Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm shadow-red-500/50 animate-bounce">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Active Incident Alerts
                </span>
                <button
                  onClick={() => {
                    setShowAlertMenu(false);
                    if (setActivePage) setActivePage('alerts');
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {unreadAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">All Nominal</p>
                    <p className="text-[11px] text-slate-400">All bins within safe thresholds. No active overflow alerts.</p>
                  </div>
                ) : (
                  unreadAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      onClick={() => {
                        setShowAlertMenu(false);
                        if (setActivePage) setActivePage('alerts');
                      }}
                      className="p-3.5 hover:bg-slate-50/90 cursor-pointer flex gap-3 items-start transition-colors group"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                          {alert.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {alert.ward} • {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-extrabold text-slate-800">{user?.name || 'Municipal User'}</span>
            <div>{getRoleBadge(user?.role)}</div>
          </div>

          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>

          <button
            onClick={logout}
            title="Log Out of System"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
