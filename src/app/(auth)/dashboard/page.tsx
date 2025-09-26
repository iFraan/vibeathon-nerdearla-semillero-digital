import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
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
        <DashboardContent user={user} />
    );
}
