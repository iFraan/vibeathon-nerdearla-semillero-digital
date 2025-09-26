"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  Users,
  Settings,
  ClipboardList,
  Bell,
  Calendar,
  FileText,
  TrendingUp,
  UserCheck,
  ClipboardCheck,
  Sprout
} from "lucide-react";
import type { UserRole } from "@/types/auth";

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  requiredRoles: UserRole[];
  description?: string;
}

// Define menu configuration
export const menuConfig: MenuSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: BarChart3,
        requiredRoles: ["student", "teacher", "coordinator"],
        description: "Main dashboard overview"
      }
    ]
  },
  {
    title: "Learning",
    items: [
      {
        title: "My Courses",
        href: "/courses",
        icon: BookOpen,
        requiredRoles: ["student"],
        description: "View your enrolled courses"
      },
      {
        title: "Assignments",
        href: "/assignments",
        icon: ClipboardList,
        requiredRoles: ["student"],
        description: "View and submit assignments"
      },
      {
        title: "Progress",
        href: "/progress",
        icon: TrendingUp,
        requiredRoles: ["student"],
        description: "Track your learning progress"
      }
    ]
  },
  {
    title: "Teaching",
    items: [
      {
        title: "My Classes",
        href: "/classes",
        icon: Users,
        requiredRoles: ["teacher", "coordinator"],
        description: "Manage your classes"
      },
      {
        title: "Assignments",
        href: "/assignments",
        icon: ClipboardCheck,
        requiredRoles: ["teacher", "coordinator"],
        description: "Create and manage assignments"
      },
      {
        title: "Submissions",
        href: "/submissions",
        icon: FileText,
        badge: { text: "New", variant: "destructive" },
        requiredRoles: ["teacher", "coordinator"],
        description: "Review student submissions"
      },
      {
        title: "Grading",
        href: "/grading",
        icon: GraduationCap,
        requiredRoles: ["teacher", "coordinator"],
        description: "Grade student work"
      }
    ]
  },
  {
    title: "Administration",
    items: [
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        requiredRoles: ["coordinator"],
        description: "Program analytics and reports"
      },
      {
        title: "User Management",
        href: "/users",
        icon: UserCheck,
        requiredRoles: ["coordinator"],
        description: "Manage students and teachers"
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
        requiredRoles: ["coordinator"],
        description: "Generate and export reports"
      }
    ]
  },
  {
    title: "General",
    items: [
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        badge: { text: "3", variant: "secondary" },
        requiredRoles: ["student", "teacher", "coordinator"],
        description: "View notifications and announcements"
      },
      {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        requiredRoles: ["student", "teacher", "coordinator"],
        description: "View assignment deadlines and events"
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        requiredRoles: ["student", "teacher", "coordinator"],
        description: "Account and preference settings"
      }
    ]
  }
];

interface AppSidebarProps {
  userRole: UserRole;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname();

  // Filter menu items based on user role
  const filteredSections = menuConfig
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.requiredRoles.includes(userRole))
    }))
    .filter(section => section.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <Sprout className="text-primary-foreground w-5 h-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold">Semillero Digital</h2>
            <p className="text-xs text-muted-foreground">Learning Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {filteredSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.title}>
            {sectionIndex > 0 && <SidebarSeparator />}
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.description}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.title}</span>
                          {item.badge && (
                            <SidebarMenuBadge>
                              {item.badge.text}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
