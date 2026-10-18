import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AlertBanner } from './components/common/AlertBanner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { BinManagementPage } from './pages/BinManagementPage';
import { BinDetailPage } from './pages/BinDetailPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { CollectionSchedulePage } from './pages/CollectionSchedulePage';
import { StaffPortalPage } from './pages/StaffPortalPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

export function App() {
  const { user, isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('landing'); // 'landing', 'login', 'register'
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);

  // Set initial active page depending on authenticated user role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'staff') {
        setActivePage('staff-portal');
      } else {
        setActivePage('dashboard');
      }
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Initializing EcoNexa Telemetry...
          </span>
        </div>
      </div>
    );
  }

  // Unauthenticated flow
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage
          onNavigateToRegister={() => setAuthView('register')}
          onNavigateToLanding={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToLanding={() => setAuthView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onNavigateToLogin={() => setAuthView('login')}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  // Role check helper
  const renderCurrentPage = () => {
    const role = user?.role || 'staff';

    switch (activePage) {
      case 'dashboard':
        if (role !== 'admin' && role !== 'officer') {
          return <UnauthorizedPage onGoBack={() => setActivePage('staff-portal')} />;
        }
        return (
          <AdminDashboard
            setActivePage={setActivePage}
            onSelectBin={(bin) => setSelectedBin(bin)}
          />
        );

      case 'staff-portal':
        return (
          <StaffPortalPage
            setActivePage={setActivePage}
            onSelectBin={(bin) => setSelectedBin(bin)}
          />
        );

      case 'bins':
        return (
          <BinManagementPage
            setActivePage={setActivePage}
            onSelectBin={(bin) => setSelectedBin(bin)}
          />
        );

      case 'bin-detail':
        return (
          <BinDetailPage
            bin={selectedBin}
            onBack={() => setActivePage('bins')}
            onDispatchCollection={(bin) => {
              setSelectedBin(bin);
              setActivePage('scheduling');
            }}
          />
        );

      case 'map':
        return (
          <LiveMapPage
            setActivePage={setActivePage}
            onSelectBin={(bin) => setSelectedBin(bin)}
          />
        );

      case 'predictions':
        if (role !== 'admin' && role !== 'officer') {
          return <UnauthorizedPage onGoBack={() => setActivePage('staff-portal')} />;
        }
        return (
          <PredictionsPage
            setActivePage={setActivePage}
            onSelectBin={(bin) => setSelectedBin(bin)}
          />
        );

      case 'scheduling':
        if (role !== 'admin') {
          return <UnauthorizedPage onGoBack={() => setActivePage('dashboard')} />;
        }
        return <CollectionSchedulePage setActivePage={setActivePage} />;

      case 'alerts':
        return <AlertsPage />;

      case 'analytics':
        if (role !== 'admin' && role !== 'officer') {
          return <UnauthorizedPage onGoBack={() => setActivePage('staff-portal')} />;
        }
        return <AnalyticsPage />;

      case 'users':
        if (role !== 'admin') {
          return <UnauthorizedPage onGoBack={() => setActivePage('dashboard')} />;
        }
        return <UserManagementPage />;

      case 'settings':
        return <ProfileSettingsPage />;

      default:
        return (
          <AdminDashboard
            setActivePage={setActivePage}
            onSelectBin={(bin) => setSelectedBin(bin)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Real-time Incident Alert Banner */}
      <AlertBanner onNavigateToAlerts={() => setActivePage('alerts')} />

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Navbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            activePage={activePage}
            setActivePage={setActivePage}
          />

          <main className="flex-1 pb-16">{renderCurrentPage()}</main>
        </div>
      </div>
    </div>
  );
}

export default App;
