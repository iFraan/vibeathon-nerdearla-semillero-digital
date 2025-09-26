"use client";

import { Bell, LogOut, RefreshCw, Settings, User } from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "@/components/navigation/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { handleSignOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

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

export function DashboardLayout({
	children,
	user,
	className,
}: DashboardLayoutProps) {
	const [syncing, setSyncing] = useState(false);
	const [syncError, setSyncError] = useState<string | null>(null);

	const getUserInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getRoleBadgeVariant = (role: UserRole) => {
		switch (role) {
			case "coordinator":
				return "destructive";
			case "teacher":
				return "default";
			case "student":
				return "secondary";
			default:
				return "outline";
		}
	};

	const handleSync = async () => {
		setSyncing(true);
		setSyncError(null);
		try {
			const res = await fetch("/api/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user.id,
					role: user.role,
					email: user.email,
					name: user.name,
				}),
			});
			if (!res.ok) throw new Error("Failed to sync data");
		} catch (err: any) {
			setSyncError(err.message || "Unknown error");
		} finally {
			setSyncing(false);
		}
	};

	return (
		<SidebarProvider>
			<AppSidebar userRole={user.role} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
					<SidebarTrigger className="-ml-1" />

					{/* Header Actions */}
					<div className="ml-auto flex items-center gap-4">
						{/* Sync Button */}
						<div className="flex flex-col items-start">
							<Button
								variant="outline"
								size="sm"
								onClick={handleSync}
								disabled={syncing}
							>
								<RefreshCw
									className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
								/>
								{syncing ? "Sincronizando..." : "Sincronizar datos"}
							</Button>
							{syncError && (
								<span className="text-red-500 text-xs mt-1">{syncError}</span>
							)}
						</div>

						{/* Notifications */}
						<Button variant="ghost" size="sm" className="relative">
							<Bell className="h-5 w-5" />
							<Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
								3
							</Badge>
						</Button>

						{/* User Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative h-8 w-8 rounded-full p-0"
								>
									<Avatar className="h-8 w-8">
										<AvatarImage src={user.image} alt={user.name} />
										<AvatarFallback>
											{getUserInitials(user.name)}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end" forceMount>
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<div className="flex items-center gap-2">
											<p className="text-sm font-medium leading-none">
												{user.name}
											</p>
											<Badge
												variant={getRoleBadgeVariant(user.role)}
												className="text-xs"
											>
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
									<span>Perfil</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Settings className="mr-2 h-4 w-4" />
									<span>Configuración</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-red-600"
									onClick={() => handleSignOut("/login")}
								>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Cerrar sesión</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleSync}
									disabled={syncing}
									className={syncing ? "opacity-50 pointer-events-none" : ""}
								>
									<RefreshCw
										className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
									/>
									<span>{syncing ? "Sincronizando..." : "Sincronizar datos"}</span>
								</DropdownMenuItem>
								{syncError && (
									<div className="px-2 pb-2 text-red-500 text-xs">
										{syncError}
									</div>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* Main Content */}
				<main className={cn("flex-1 p-4", className)}>{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
