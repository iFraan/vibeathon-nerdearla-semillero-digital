import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    image: session.user.image
  };

  return (
    <DashboardLayout user={user}>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardContent user={user} />
      </Suspense>
    </DashboardLayout>
  );
}
