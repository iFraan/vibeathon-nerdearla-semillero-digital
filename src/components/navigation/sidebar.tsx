"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  ClipboardCheck
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
        href: "/student/courses",
        icon: BookOpen,
        requiredRoles: ["student"],
        description: "View your enrolled courses"
      },
      {
        title: "Assignments",
        href: "/student/assignments",
        icon: ClipboardList,
        requiredRoles: ["student"],
        description: "View and submit assignments"
      },
      {
        title: "Progress",
        href: "/student/progress",
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
        href: "/teacher/classes",
        icon: Users,
        requiredRoles: ["teacher", "coordinator"],
        description: "Manage your classes"
      },
      {
        title: "Assignments",
        href: "/teacher/assignments",
        icon: ClipboardCheck,
        requiredRoles: ["teacher", "coordinator"],
        description: "Create and manage assignments"
      },
      {
        title: "Submissions",
        href: "/teacher/submissions",
        icon: FileText,
        badge: { text: "New", variant: "destructive" },
        requiredRoles: ["teacher", "coordinator"],
        description: "Review student submissions"
      },
      {
        title: "Grading",
        href: "/teacher/grading",
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
        href: "/coordinator/analytics",
        icon: BarChart3,
        requiredRoles: ["coordinator"],
        description: "Program analytics and reports"
      },
      {
        title: "User Management",
        href: "/coordinator/users",
        icon: UserCheck,
        requiredRoles: ["coordinator"],
        description: "Manage students and teachers"
      },
      {
        title: "Reports",
        href: "/coordinator/reports",
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

interface SidebarProps {
  userRole: UserRole;
  className?: string;
}

export function Sidebar({ userRole, className }: SidebarProps) {
  const pathname = usePathname();

  // Filter menu items based on user role
  const filteredSections = menuConfig
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.requiredRoles.includes(userRole))
    }))
    .filter(section => section.items.length > 0);

  return (
    <nav className={cn("flex flex-col space-y-6 p-4", className)}>
      {filteredSections.map((section, sectionIndex) => (
        <div key={section.title} className="space-y-2">
          {sectionIndex > 0 && <Separator className="my-4" />}
          
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {section.title}
          </h3>
          
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 h-auto p-2",
                      isActive && "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge 
                            variant={item.badge.variant} 
                            className="ml-auto text-xs"
                          >
                            {item.badge.text}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
