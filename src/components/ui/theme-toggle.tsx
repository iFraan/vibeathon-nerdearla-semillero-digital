"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const [theme, setTheme] = useState<"light" | "dark">("light");

	// On mount, check localStorage or system preference
	useEffect(() => {
		setMounted(true);
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("theme");
			if (stored === "dark" || stored === "light") {
				setTheme(stored);
				setHtmlClass(stored);
			} else {
				// System preference
				const prefersDark = window.matchMedia(
					"(prefers-color-scheme: dark)",
				).matches;
				setTheme(prefersDark ? "dark" : "light");
				setHtmlClass(prefersDark ? "dark" : "light");
			}
		}
	}, []);

	function setHtmlClass(mode: "light" | "dark") {
		if (typeof document !== "undefined") {
			document.documentElement.classList.toggle("dark", mode === "dark");
		}
	}

	function toggleTheme() {
		const next = theme === "light" ? "dark" : "light";
		setTheme(next);
		setHtmlClass(next);
		if (typeof window !== "undefined") {
			localStorage.setItem("theme", next);
		}
	}

	// Prevent hydration mismatch
	if (!mounted) return null;

	return (
		<button
			aria-label={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}
			onClick={toggleTheme}
			className="rounded-full p-2 bg-muted hover:bg-accent/60 text-primary-foreground transition-colors border border-border shadow text-xl"
			title={theme === "light" ? "Modo oscuro" : "Modo claro"}
			type="button"
		>
			{theme === "light" ? (
				<Moon className="text-foreground h-4 w-4" />
			) : (
				<Sun className="text-foreground h-4 w-4" />
			)}
		</button>
	);
}
