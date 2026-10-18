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

  // Helper to extract clean page id from window.location.hash
  const getPageFromHash = () => {
    return window.location.hash.replace(/^#\/?/, '').trim();
  };

  const [authView, setAuthView] = useState(() => {
    const hash = getPageFromHash();
    return hash === 'login' || hash === 'register' ? hash : 'landing';
  });

  const [activePage, setActivePage] = useState(() => {
    const hash = getPageFromHash();
    return hash || 'dashboard';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedBin, setSelectedBin] = useState(() => {
    try {
      const saved = sessionStorage.getItem('econexa_selected_bin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // History-aware navigation handler
  const navigateTo = (page, bin = null) => {
    if (bin) {
      setSelectedBin(bin);
      try {
        sessionStorage.setItem('econexa_selected_bin', JSON.stringify(bin));
      } catch (e) {}
    }

    if (isAuthenticated) {
      setActivePage(page);
      if (getPageFromHash() !== page) {
        window.history.pushState({ page, binId: bin?.binId }, '', `#${page}`);
      }
    } else {
      setAuthView(page);
      if (getPageFromHash() !== page) {
        window.history.pushState({ view: page }, '', `#${page}`);
      }
    }
  };

  // Sync state when browser Back/Forward (Undo/Redo) buttons are clicked
  useEffect(() => {
    const handlePopState = () => {
      const hashPage = getPageFromHash();

      if (!isAuthenticated) {
        if (hashPage === 'login' || hashPage === 'register') {
          setAuthView(hashPage);
        } else {
          setAuthView('landing');
        }
      } else {
        const validPages = [
          'dashboard',
          'staff-portal',
          'bins',
          'bin-detail',
          'map',
          'predictions',
          'scheduling',
          'alerts',
          'analytics',
          'users',
          'settings',
        ];

        if (validPages.includes(hashPage)) {
          setActivePage(hashPage);
          if (hashPage === 'bin-detail') {
            try {
              const cached = sessionStorage.getItem('econexa_selected_bin');
              if (cached) setSelectedBin(JSON.parse(cached));
            } catch (e) {}
          }
        } else {
          // If user hit back to root/empty or landing while authenticated, keep them on their default dashboard
          const defaultPage = user?.role === 'staff' ? 'staff-portal' : 'dashboard';
          setActivePage(defaultPage);
          window.history.replaceState({ page: defaultPage }, '', `#${defaultPage}`);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, user]);

  // Set initial active page depending on authenticated user role or current hash
  useEffect(() => {
    if (isAuthenticated && user) {
      const hashPage = getPageFromHash();
      const validPages = [
        'dashboard',
        'staff-portal',
        'bins',
        'bin-detail',
        'map',
        'predictions',
        'scheduling',
        'alerts',
        'analytics',
        'users',
        'settings',
      ];

      let targetPage = hashPage && validPages.includes(hashPage) ? hashPage : null;
      if (!targetPage) {
        targetPage = user.role === 'staff' ? 'staff-portal' : 'dashboard';
      }

      setActivePage(targetPage);
      window.history.replaceState({ page: targetPage }, '', `#${targetPage}`);
    } else if (!isAuthenticated) {
      const hashPage = getPageFromHash();
      if (hashPage === 'login' || hashPage === 'register') {
        setAuthView(hashPage);
      } else {
        setAuthView('landing');
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

  // Unauthenticated flow with history support
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage
          onNavigateToRegister={() => navigateTo('register')}
          onNavigateToLanding={() => navigateTo('landing')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateToLogin={() => navigateTo('login')}
          onNavigateToLanding={() => navigateTo('landing')}
        />
      );
    }
    return (
      <LandingPage
        onNavigateToLogin={() => navigateTo('login')}
        onNavigateToRegister={() => navigateTo('register')}
      />
    );
  }

  // Role check helper
  const renderCurrentPage = () => {
    const role = user?.role || 'staff';

    switch (activePage) {
      case 'dashboard':
        if (role !== 'admin' && role !== 'officer') {
          return <UnauthorizedPage onGoBack={() => navigateTo('staff-portal')} />;
        }
        return (
          <AdminDashboard
            setActivePage={navigateTo}
            onSelectBin={(bin) => navigateTo('bin-detail', bin)}
          />
        );

      case 'staff-portal':
        return (
          <StaffPortalPage
            setActivePage={navigateTo}
            onSelectBin={(bin) => navigateTo('bin-detail', bin)}
          />
        );

      case 'bins':
        return (
          <BinManagementPage
            setActivePage={navigateTo}
            onSelectBin={(bin) => navigateTo('bin-detail', bin)}
          />
        );

      case 'bin-detail':
        return (
          <BinDetailPage
            bin={selectedBin}
            onBack={() => navigateTo('bins')}
            onDispatchCollection={(bin) => navigateTo('scheduling', bin)}
          />
        );

      case 'map':
        return (
          <LiveMapPage
            setActivePage={navigateTo}
            onSelectBin={(bin) => navigateTo('bin-detail', bin)}
          />
        );

      case 'predictions':
        if (role !== 'admin' && role !== 'officer') {
          return <UnauthorizedPage onGoBack={() => navigateTo('staff-portal')} />;
        }
        return (
          <PredictionsPage
            setActivePage={navigateTo}
            onSelectBin={(bin) => navigateTo('bin-detail', bin)}
          />
        );

      case 'scheduling':
        if (role !== 'admin') {
          return <UnauthorizedPage onGoBack={() => navigateTo('dashboard')} />;
        }
        return <CollectionSchedulePage setActivePage={navigateTo} />;

      case 'alerts':
        return <AlertsPage />;

      case 'analytics':
        if (role !== 'admin' && role !== 'officer') {
          return <UnauthorizedPage onGoBack={() => navigateTo('staff-portal')} />;
        }
        return <AnalyticsPage />;

      case 'users':
        if (role !== 'admin') {
          return <UnauthorizedPage onGoBack={() => navigateTo('dashboard')} />;
        }
        return <UserManagementPage />;

      case 'settings':
        return <ProfileSettingsPage />;

      default:
        return (
          <AdminDashboard
            setActivePage={navigateTo}
            onSelectBin={(bin) => navigateTo('bin-detail', bin)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Real-time Incident Alert Banner */}
      <AlertBanner onNavigateToAlerts={() => navigateTo('alerts')} />

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={navigateTo}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Navbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            activePage={activePage}
            setActivePage={navigateTo}
          />

          <main className="flex-1 pb-16">{renderCurrentPage()}</main>
        </div>
      </div>
    </div>
  );
}

export default App;
