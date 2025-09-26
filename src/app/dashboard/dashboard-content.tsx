"use client";

import { useEffect, useState } from "react";
import { DashboardRouter } from "@/components/dashboard/dashboard-router";
import { LoadingState, ErrorState } from "@/components/ui/empty-state";
import type { UserRole } from "@/types/auth";

interface DashboardContentProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch dashboard data");
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user.id]);

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        description={error}
        action={{
          label: "Retry",
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  if (loading || !data) {
    return <LoadingState title="Loading your dashboard..." description="Please wait while we fetch your data" />;
  }

  return <DashboardRouter user={user} data={data} loading={loading} />;
}
