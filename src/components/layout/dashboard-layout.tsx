"use client";

import { useState } from "react";
import { Sidebar } from "@/components/navigation/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  RefreshCw
} from "lucide-react";
import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string;
  };
  className?: string;
}

export function DashboardLayout({ children, user, className }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'coordinator':
        return 'destructive';
      case 'teacher':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center border-b">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SD</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Semillero Digital</h2>
                <p className="text-xs text-muted-foreground">Learning Dashboard</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <Sidebar userRole={user.role} />
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="sm">
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          {/* Breadcrumb / Page Title - Mobile */}
          <div className="flex-1 lg:hidden">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex lg:flex-1 lg:gap-x-6">
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Sync Button */}
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Data
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">3</Badge>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mobile User Menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                  <Badge className="ml-auto text-xs">3</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Sync Data</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <SheetContent side="left" className="flex flex-col p-0 w-72">
          <div className="flex h-16 shrink-0 items-center border-b px-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SD</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Semillero Digital</h2>
                <p className="text-xs text-muted-foreground">Learning Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar userRole={user.role} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-72">
        <main className={cn("py-6", className)}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
