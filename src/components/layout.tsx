import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut, LayoutGrid, FolderKanban, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { removeToken } from '@/lib/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const isProjectsActive = location.pathname.startsWith('/projects');
  const isPersonalActive = location.pathname.startsWith('/personal');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/projects" className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <span className="text-lg tracking-tight">SeedhaHisaab</span>
          </Link>
          <nav className="flex items-center gap-1 ml-2">
            <Link
              to="/projects"
              data-testid="nav-projects"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                isProjectsActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <Link
              to="/personal"
              data-testid="nav-personal"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                isPersonalActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Personal</span>
            </Link>
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-logout"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
