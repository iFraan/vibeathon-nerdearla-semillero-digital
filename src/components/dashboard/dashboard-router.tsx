"use client";

import { Suspense } from "react";
import { StudentOverview } from "./student/student-overview";
import { TeacherOverview } from "./teacher/teacher-overview";
import { CoordinatorOverview } from "./coordinator/coordinator-overview";
import { LoadingState } from "@/components/ui/empty-state";
import type { UserRole } from "@/types/auth";

interface DashboardRouterProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  data: any; // This would be typed based on the specific dashboard needs
  loading?: boolean;
}

export function DashboardRouter({ user, data, loading }: DashboardRouterProps) {
  const renderDashboard = () => {
    switch (user.role) {
      case "student":
        return (
          <StudentOverview
            studentId={user.id}
            data={data}
            loading={loading}
          />
        );
      case "teacher":
        return (
          <TeacherOverview
            teacherId={user.id}
            data={data}
            loading={loading}
          />
        );
      case "coordinator":
        return (
          <CoordinatorOverview
            coordinatorId={user.id}
            data={data}
            loading={loading}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-muted-foreground">
                Invalid user role
              </h2>
              <p className="text-sm text-muted-foreground">
                Please contact support if this error persists.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Suspense fallback={<LoadingState title="Loading dashboard..." />}>
      {renderDashboard()}
    </Suspense>
  );
}
