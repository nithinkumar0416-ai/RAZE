import React, { useState, useEffect } from 'react';
import { RazeNavbar } from './components/layout/RazeNavbar';
import { RazeHeroPage } from './pages/RazeHeroPage';
import { RazeAgentPage } from './pages/RazeAgentPage';
import { RazeTasksPage } from './pages/RazeTasksPage';
import { RazeResearchPage } from './pages/RazeResearchPage';
import { RazeProjectsPage } from './pages/RazeProjectsPage';
import { RazeActivityPage } from './pages/RazeActivityPage';
import { RazeSettingsPage } from './pages/RazeSettingsPage';

import { AstraStarfield } from './components/canvas/AstraStarfield';

// Secondary sandbox pages (for deep code verification)
import { VerificationRunsPage } from './pages/VerificationRunsPage';
import { LiveVerificationRoomPage } from './pages/LiveVerificationRoomPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  const [taskInitialIntent, setTaskInitialIntent] = useState<string | undefined>(undefined);

  // Synchronize browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string, intent?: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    if (intent) {
      setTaskInitialIntent(intent);
    }
  };

  const handleAwaken = () => {
    navigate('/agent');
  };

  const handleNavigateToTasks = (planIntent?: string) => {
    navigate('/tasks', planIntent);
  };

  // Render RAZE page based on current path
  const renderCurrentPage = () => {
    if (currentPath === '/' || currentPath === '') {
      return <RazeHeroPage onAwaken={handleAwaken} onNavigate={navigate} />;
    }
    if (currentPath === '/agent') {
      return <RazeAgentPage onNavigateToTasks={handleNavigateToTasks} />;
    }
    if (currentPath === '/tasks') {
      return <RazeTasksPage initialIntent={taskInitialIntent} />;
    }
    if (currentPath === '/research') {
      return <RazeResearchPage />;
    }
    if (currentPath === '/projects') {
      return <RazeProjectsPage />;
    }
    if (currentPath === '/activity') {
      return <RazeActivityPage />;
    }
    if (currentPath === '/settings') {
      return <RazeSettingsPage />;
    }

    // Secondary Verification Sandbox Routes
    if (currentPath === '/runs' || currentPath === '/verification') {
      return <VerificationRunsPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/runs/')) {
      const id = currentPath.replace('/runs/', '');
      return <LiveVerificationRoomPage runId={id} onNavigate={navigate} />;
    }

    // Default Fallback
    return <RazeHeroPage onAwaken={handleAwaken} onNavigate={navigate} />;
  };

  const isHome = currentPath === '/' || currentPath === '';

  return (
    <div className="relative min-h-screen bg-raze-void text-raze-silver flex flex-col font-sans selection:bg-raze-blue/30 selection:text-raze-ice overflow-x-hidden">
      {/* Global ChatGPT Astra 3D Mouse Tracking Starfield for non-hero views */}
      {!isHome && (
        <AstraStarfield
          className="fixed inset-0 w-full h-full z-0 opacity-45 pointer-events-none"
          starCount={320}
          opacity={0.55}
          interactive={true}
        />
      )}

      {/* Cinematic Top Navigation Header */}
      <RazeNavbar
        currentPath={currentPath}
        onNavigate={navigate}
      />

      {/* Main Working View */}
      <main className="relative z-10 flex-1 w-full">
        {renderCurrentPage()}
      </main>
    </div>
  );
};
