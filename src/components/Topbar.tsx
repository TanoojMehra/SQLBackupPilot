'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/DropdownMenu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/Sheet';

import { Button } from '@/components/Button';
import { 
  CircleUser, 
  Menu, 
  Package2, 
  Settings,
  User,
  LogOut,
  HelpCircle,
  Database,
  Home,
  Users,
  HardDrive,
  Calendar,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const mobileNavigationItems = [
  { title: 'Dashboard', href: '/dashboard', icon: Home },
  { title: 'Databases', href: '/dashboard/databases', icon: Database },
  { title: 'Backups', href: '/dashboard/backups', icon: HardDrive },
  { title: 'Schedules', href: '/dashboard/schedules', icon: Calendar },
  { title: 'Storage', href: '/dashboard/storage', icon: FileText },
  { title: 'Users', href: '/dashboard/users', icon: Users },
  { title: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle },
  { title: 'Profile', href: '/dashboard/profile', icon: User },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface UserProfile {
  email: string;
  role: string;
}

export function Topbar() {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile({
            email: data.profile.email,
            role: data.profile.role
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Mobile menu and brand */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              {/* Mobile Header */}
              <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Package2 className="h-4 w-4" />
                  </div>
                  <span className="text-lg">SQLBackupPilot</span>
                </Link>
              </div>
              
              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1">
                  {mobileNavigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop brand (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Removed SQLBackupPilot branding as requested - it's still in sidebar */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CircleUser className="h-4 w-4" />
                </div>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.email || 'Loading...'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.role || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="https://github.com/TanoojMehra/SQLBackupPilot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onClick={() => {
                  window.location.href = '/api/logout';
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 