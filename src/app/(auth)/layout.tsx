import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

interface Props {
  children: React.ReactNode;
}

export default async function Layout({ children }: Props) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user) {
    redirect("/login?callbackUrl=");
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role || "student", // Default to student role
    image: session.user.image || undefined
  };

  return (
    <DashboardLayout user={user}>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        {children}
      </Suspense>
    </DashboardLayout>
  );
}
