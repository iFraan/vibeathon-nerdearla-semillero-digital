"use client";

import { LogIn, Loader2, Sprout } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { handleSignIn, handleDemoSignIn } from "@/lib/auth-client";

export default function SignInPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSignIn = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const returnTo = "/dashboard";
			await handleSignIn("google", returnTo);
			// Redirect will be handled by the auth callback or returnTo param
		} catch (error) {
			console.error("Sign in failed:", error);
			setError("Failed to sign in. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const onDemoSignIn = async () => {
		try {
			setIsLoading(true);
			setError(null);
			await handleDemoSignIn();
		} catch (error) {
			console.error("Demo sign in failed:", error);
			setError("Failed to sign in with demo. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-md space-y-8">
				{/* Header Section */}
				<div className="flex flex-col items-center gap-4 bg-background border-b border-border px-4 py-6 rounded-xl shadow-sm">
					<div className="flex items-center gap-3">
						<div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
							<Sprout className="h-8 w-8 text-primary-foreground" />
						</div>
					</div>
					<div className="text-center">
						<h2 className="text-2xl font-extrabold text-foreground leading-tight mb-1">
							Semillero Digital
						</h2>
						<p className="text-sm text-muted-foreground font-medium">
							Accede a tu dashboard y rastrea tu progreso
						</p>
					</div>
				</div>

				{/* Login Card */}
				<Card className="bg-background rounded-xl border border-border shadow">
					<CardHeader className="text-center">
						<CardTitle className="flex items-center gap-2 justify-center text-foreground">
							<LogIn className="h-5 w-5" />
							Iniciar Sesión
						</CardTitle>
						<CardDescription className="text-muted-foreground">
							Usa tu cuenta de Google para continuar
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						{error && (
							<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						<Button
							onClick={onSignIn}
							disabled={isLoading}
							className="w-full h-12 text-base font-medium"
							size="lg"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Iniciando sesión...
								</>
							) : (
								<>
									<LogIn className="mr-2 h-5 w-5" />
									Continuar con Google
								</>
							)}
						</Button>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-border" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">o</span>
							</div>
						</div>

						<Button
							onClick={onDemoSignIn}
							disabled={isLoading}
							variant="outline"
							className="w-full h-12 text-base font-medium bg-muted hover:text-foreground"
							size="lg"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Iniciando sesión...
								</>
							) : (
								<>
									<Sprout className="mr-2 h-5 w-5" />
									Probar con Usuario Demo
								</>
							)}
						</Button>

						<div className="text-center text-sm text-muted-foreground">
							<p>
								Al iniciar sesión, aceptas acceder a tus datos de Google Classroom para
								rastrear tu progreso educativo.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
