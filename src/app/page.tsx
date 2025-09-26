"use client";

import {
	BarChart3,
	Bell,
	BookOpen,
	Calendar,
	ClipboardCheck,
	ClipboardList,
	FileText,
	GraduationCap,
	Settings,
	TrendingUp,
	UserCheck,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const roles = [
	{
		name: "Estudiantes",
		color: "from-[var(--primary)] to-[var(--secondary)]",
		icon: <BookOpen className="w-7 h-7 text-[var(--primary-foreground)]" />,
		features: [
			"Seguimiento visual de tu progreso",
			"Notificaciones y deadlines claros",
			"Métricas y gráficos de avance",
			"Comunidad y apoyo docente",
		],
	},
	{
		name: "Docentes",
		color: "from-[var(--secondary)] to-[var(--accent)]",
		icon: (
			<GraduationCap className="w-7 h-7 text-[var(--secondary-foreground)]" />
		),
		features: [
			"Gestión de clases y estudiantes",
			"Análisis de desempeño por clase",
			"Comunicación rápida y efectiva",
			"Paneles intuitivos y administración fácil",
		],
	},
	{
		name: "Coordinadores",
		color: "from-[var(--accent)] to-[var(--primary)]",
		icon: <BarChart3 className="w-7 h-7 text-[var(--accent-foreground)]" />,
		features: [
			"Dashboard multi-cohorte",
			"Métricas y reportes avanzados",
			"Gestión de usuarios y clases",
			"Exportación de datos y administración",
		],
	},
];

const quickLinks = [
	{
		label: "Dashboard",
		icon: <BarChart3 className="w-5 h-5" />,
		color: "bg-[var(--primary)] text-[var(--primary-foreground)]",
	},
	{
		label: "Cursos",
		icon: <BookOpen className="w-5 h-5" />,
		color: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
	},
	{
		label: "Progreso",
		icon: <TrendingUp className="w-5 h-5" />,
		color: "bg-[var(--accent)] text-[var(--accent-foreground)]",
	},
	{
		label: "Notificaciones",
		icon: <Bell className="w-5 h-5" />,
		color: "bg-[var(--muted)] text-[var(--muted-foreground)]",
	},
];

export default function Home() {
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleLogin = () => {
		setLoading(true);
		router.push("/login");
	};

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
			{/* Navbar */}
			<nav className="fixed w-full z-20 top-0 left-0 bg-background/90 backdrop-blur-md shadow-sm border-b border-border">
				<div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-[var(--radius)] bg-primary flex items-center justify-center shadow font-bold text-lg text-primary-foreground select-none border-2 border-border">
							SD
						</div>
						<div>
							<span className="font-extrabold text-xl text-foreground tracking-tight leading-tight block">
								Semillero Digital
							</span>
							<span className="text-xs text-muted-foreground font-medium block -mt-1">
								Plataforma de aprendizaje
							</span>
						</div>
					</div>
					<Button
						onClick={handleLogin}
						disabled={loading}
						className="font-semibold px-6 shadow-md rounded-[var(--radius)] bg-primary text-primary-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
						size="lg"
					>
						{loading ? "Redirigiendo..." : "Ingresar"}
					</Button>
				</div>
			</nav>

			{/* Hero */}
			<section className="relative flex flex-col items-center justify-center flex-1 pt-32 pb-12 px-4 bg-background transition-colors">
				<div className="flex flex-col items-center gap-4">
					<div className="h-16 w-16 rounded-[var(--radius-xl)] bg-primary flex items-center justify-center shadow-lg font-bold text-3xl text-primary-foreground border-4 border-border mb-2 animate-in fade-in zoom-in">
						SD
					</div>
					<h1 className="text-4xl md:text-6xl font-extrabold text-foreground text-center drop-shadow mb-4 animate-in fade-in slide-in-from-top-8">
						Potenciá tu futuro digital
					</h1>
					<p className="text-lg md:text-2xl text-muted-foreground text-center max-w-2xl mb-6 font-medium animate-in fade-in slide-in-from-bottom-8">
						La plataforma moderna para estudiantes, docentes y coordinadores:
						seguimiento, progreso y comunidad en un solo lugar.
					</p>
					<Button
						onClick={handleLogin}
						disabled={loading}
						className="text-lg px-8 py-4 rounded-full bg-primary text-primary-foreground hover:bg-secondary hover:text-secondary-foreground shadow-xl font-bold border-2 border-border animate-in fade-in"
						size="lg"
					>
						{loading ? "Redirigiendo..." : "Ingresar con Google"}
					</Button>
				</div>
				{/* Quick links */}
				<div className="flex gap-3 mt-10 flex-wrap justify-center animate-in fade-in slide-in-from-bottom-8">
					{quickLinks.map((link) => (
						<div
							key={link.label}
							className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] bg-muted text-muted-foreground shadow-md font-semibold text-sm`}
						>
							{link.icon}
							<span>{link.label}</span>
						</div>
					))}
				</div>
			</section>

			{/* Features by role */}
			<section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 pb-20 mt-8">
				{roles.map((role) => (
					<div
						key={role.name}
						className={`rounded-[var(--radius-xl)] shadow-xl border-2 border-border bg-background p-7 flex flex-col gap-4 hover:scale-[1.025] transition-transform group`}
						tabIndex={0}
						aria-label={`Características para ${role.name}`}
					>
						<div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted shadow group-hover:scale-110 transition-transform mb-2">
							{role.icon}
						</div>
						<h2 className="text-2xl font-bold text-foreground mb-1 drop-shadow">
							{role.name}
						</h2>
						<ul className="text-foreground text-base font-medium space-y-1 pl-1">
							{role.features.map((f, i) => (
								<li key={i} className="flex items-center gap-2">
									<span className="text-lg">✔️</span>
									<span>{f}</span>
								</li>
							))}
						</ul>
					</div>
				))}
			</section>

			{/* Call to action */}
			<section className="flex flex-col items-center justify-center py-10 px-4 bg-background border-t border-border">
				<h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3 text-center">
					¿Listo para potenciar tu aprendizaje?
				</h3>
				<Button
					onClick={handleLogin}
					disabled={loading}
					className="text-lg px-8 py-4 rounded-full bg-primary text-primary-foreground hover:bg-secondary hover:text-secondary-foreground shadow-xl font-bold border-2 border-border"
					size="lg"
				>
					{loading ? "Redirigiendo..." : "Comenzar ahora"}
				</Button>
			</section>

			{/* Footer */}
			<footer className="py-6 text-muted-foreground text-xs text-center border-t border-border bg-background/90 backdrop-blur">
				&copy; {new Date().getFullYear()} Semillero Digital &mdash; Potenciando
				tu futuro digital.
			</footer>
		</div>
	);
}
