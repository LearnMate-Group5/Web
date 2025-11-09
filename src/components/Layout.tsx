import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, UserCog, BookOpen, LogOut, User, CreditCard } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user?.roles.includes('Admin');
  const isStaff = user?.roles.includes('Staff');

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col fixed h-screen">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-primary to-primary/80">
          <h2 className="text-xl font-bold text-primary-foreground">LearnMate</h2>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {isAdmin && (
            <>
              <Link 
                to="/admin/users" 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === '/admin/users' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Users className="h-4 w-4" />
                Quản lý người dùng
              </Link>
              <Link 
                to="/admin/staff" 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === '/admin/staff' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <UserCog className="h-4 w-4" />
                Quản lý nhân viên
              </Link>
              <Link 
                to="/admin/subscriptions" 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === '/admin/subscriptions' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <CreditCard className="h-4 w-4" />
                Gói đăng ký
              </Link>
            </>
          )}
          
          {isStaff && (
            <Link 
              to="/staff" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === '/staff' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <BookOpen className="h-4 w-4" />
              Quản lý sách
            </Link>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">{user?.name}</p>
            </div>
            <p className="text-xs text-muted-foreground ml-6">{user?.email}</p>
            <p className="text-xs text-primary ml-6 font-medium uppercase">{user?.roles.join(', ')}</p>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="destructive" 
            className="w-full"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
};

export default Layout;
