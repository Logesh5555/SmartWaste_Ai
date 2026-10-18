import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Trash2,
  MapPin,
  Cpu,
  CalendarDays,
  Truck,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  Sparkles,
  X,
  ChevronRight,
} from 'lucide-react';

export const Sidebar = ({ activePage, setActivePage, isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'staff';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'officer'],
    },
    {
      id: 'staff-portal',
      label: 'Staff Task Portal',
      icon: Truck,
      roles: ['staff', 'admin'],
      badge: role === 'staff' ? 'My Tasks' : null,
    },
    {
      id: 'bins',
      label: 'Bin Management',
      icon: Trash2,
      roles: ['admin', 'officer', 'staff'],
    },
    {
      id: 'map',
      label: 'Live Monitoring Map',
      icon: MapPin,
      roles: ['admin', 'officer', 'staff'],
    },
    {
      id: 'predictions',
      label: 'AI Fill Predictions',
      icon: Cpu,
      roles: ['admin', 'officer'],
      badge: 'ML Engine',
    },
    {
      id: 'scheduling',
      label: 'Smart Route Scheduling',
      icon: CalendarDays,
      roles: ['admin'],
    },
    {
      id: 'alerts',
      label: 'Alerts & Incidents',
      icon: AlertTriangle,
      roles: ['admin', 'officer', 'staff'],
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: BarChart3,
      roles: ['admin', 'officer'],
    },
    {
      id: 'users',
      label: 'User Administration',
      icon: Users,
      roles: ['admin'],
    },
    {
      id: 'settings',
      label: 'System & Profile',
      icon: Settings,
      roles: ['admin', 'officer', 'staff'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/80 shadow-2xl lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-emerald-500/30 group-hover:scale-105 group-hover:rotate-2 transition-all">
              EN
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight">EcoNexa</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Indicator */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Scope</p>
          <p className="text-xs font-bold text-emerald-400 capitalize">
            {role === 'admin' ? 'System Administrator' : role === 'officer' ? 'Monitoring Officer' : 'Field Operations Staff'}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  onClose();
                }}
                className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.01]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 hover:translate-x-1'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-700/80 text-white'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 group-hover:border-emerald-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform opacity-0 group-hover:opacity-100 ${
                      isActive ? 'opacity-100 text-emerald-200' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom AI engine status badge */}
        <div className="p-3.5 m-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-3 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-200 group">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
              Scikit-Learn ML Active
            </p>
            <p className="text-[10px] text-slate-400 truncate">RF Multi-Horizon Model</p>
          </div>
        </div>
      </aside>
    </>
  );
};
