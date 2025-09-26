"use client";

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
			className="rounded-full p-2 bg-muted hover:bg-accent transition-colors border border-border shadow text-xl"
			title={theme === "light" ? "Modo oscuro" : "Modo claro"}
			type="button"
		>
			{theme === "light" ? (
				// Moon icon
				<svg
					width={22}
					height={22}
					fill="none"
					viewBox="0 0 24 24"
					className="text-foreground"
				>
					<path
						d="M21 12.79A9 9 0 0111.21 3a1 1 0 00-1.13 1.32A7 7 0 1019.68 13.92a1 1 0 001.32-1.13z"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			) : (
				// Sun icon
				<svg
					width={22}
					height={22}
					fill="none"
					viewBox="0 0 24 24"
					className="text-foreground"
				>
					<circle cx={12} cy={12} r={5} stroke="currentColor" strokeWidth={2} />
					<path
						d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
					/>
				</svg>
			)}
		</button>
	);
}
