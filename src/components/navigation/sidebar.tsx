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
  disabled?: boolean; // Added disabled property, defaults to false
}

// Define menu configuration
export const menuConfig: MenuSection[] = [
  {
    title: "Panel Principal",
    items: [
      {
        title: "Resumen",
        href: "/dashboard",
        icon: BarChart3,
        requiredRoles: ["student", "teacher", "coordinator"],
        description: "Vista general del panel principal",
        disabled: false
      }
    ]
  },
  {
    title: "Aprendizaje",
    items: [
      {
        title: "Mis Cursos",
        href: "/courses",
        icon: BookOpen,
        requiredRoles: ["student"],
        description: "Ver tus cursos inscritos",
        disabled: false
      },
      {
        title: "Tareas",
        href: "/assignments",
        icon: ClipboardList,
        requiredRoles: ["student"],
        description: "Ver y enviar tareas",
        disabled: false
      },
      {
        title: "Progreso",
        href: "/progress",
        icon: TrendingUp,
        requiredRoles: ["student"],
        description: "Seguir tu progreso de aprendizaje",
        disabled: false
      }
    ]
  },
  {
    title: "Enseñanza",
    items: [
      {
        title: "Mis Clases",
        href: "/classes",
        icon: Users,
        requiredRoles: ["teacher", "coordinator"],
        description: "Gestionar tus clases",
        disabled: false
      },
      {
        title: "Tareas",
        href: "/assignments",
        icon: ClipboardCheck,
        requiredRoles: ["teacher", "coordinator"],
        description: "Crear y gestionar tareas",
        disabled: false
      },
      {
        title: "Entregas",
        href: "/submissions",
        icon: FileText,
        badge: { text: "Nuevo", variant: "destructive" },
        requiredRoles: ["teacher", "coordinator"],
        description: "Revisar entregas de estudiantes",
        disabled: false
      },
      {
        title: "Calificaciones",
        href: "/grading",
        icon: GraduationCap,
        requiredRoles: ["teacher", "coordinator"],
        description: "Calificar trabajo de estudiantes",
        disabled: false
      }
    ]
  },
  {
    title: "Administración",
    items: [
      {
        title: "Analíticas",
        href: "/analytics",
        icon: BarChart3,
        requiredRoles: ["coordinator"],
        description: "Analíticas del programa e informes",
        disabled: false
      },
      {
        title: "Gestión de Usuarios",
        href: "/users",
        icon: UserCheck,
        requiredRoles: ["coordinator"],
        description: "Gestionar estudiantes y profesores",
        disabled: false
      },
      {
        title: "Reportes",
        href: "/reports",
        icon: FileText,
        requiredRoles: ["coordinator"],
        description: "Generar y exportar reportes",
        disabled: false
      }
    ]
  },
  {
    title: "General",
    items: [
      {
        title: "Notificaciones",
        href: "/notifications",
        icon: Bell,
        badge: { text: "3", variant: "secondary" },
        requiredRoles: ["student", "teacher", "coordinator"],
        description: "Ver notificaciones y anuncios",
        disabled: false
      },
      {
        title: "Calendario",
        href: "/calendar",
        icon: Calendar,
        requiredRoles: ["student", "teacher", "coordinator"],
        description: "Ver fechas límite de tareas y eventos",
        disabled: true
      },
      {
        title: "Configuración",
        href: "/settings",
        icon: Settings,
        requiredRoles: ["student", "teacher", "coordinator"],
        description: "Configuración de cuenta y preferencias",
        disabled: false
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
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <Sprout className="text-primary-foreground w-5 h-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold">Semillero Digital</h2>
            <p className="text-xs text-muted-foreground">Panel de Aprendizaje</p>
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
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.description} disabled={item.disabled}>
                        {item.disabled ? (
                          <span
                            aria-disabled="true"
                            tabIndex={-1}
                            style={{ pointerEvents: "none", display: "flex", alignItems: "center", width: "100%" }}
                          >
                            <Icon />
                            <span>{item.title}</span>
                            {item.badge && (
                              <SidebarMenuBadge>
                                {item.badge.text}
                              </SidebarMenuBadge>
                            )}
                          </span>
                        ) : (
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.title}</span>
                            {item.badge && (
                              <SidebarMenuBadge>
                                {item.badge.text}
                              </SidebarMenuBadge>
                            )}
                          </Link>
                        )}
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
