"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	BookOpen,
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	Sprout,
	TrendingUp,
	Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ProgressChart, TrendChart } from "@/components/ui/charts";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface StudentOverviewProps {
	studentId: string;
	data: {
		overallMetrics: {
			completionRate: number;
			averageGrade: number | null;
			onTimeSubmissionRate: number;
			totalAssignments: number;
			completedAssignments: number;
			lateAssignments: number;
			missedAssignments: number;
			lastActivity?: Date;
		};
		courseProgress: Array<{
			courseId: string;
			courseName: string;
			completionRate: number;
			averageGrade: number | null;
			totalAssignments: number;
			completedAssignments: number;
			riskLevel: "low" | "medium" | "high";
		}>;
		upcomingDeadlines: Array<{
			id: string;
			title: string;
			courseName: string;
			dueDate: Date;
			isSubmitted: boolean;
			isLate: boolean;
		}>;
		recentActivity: Array<{
			id: string;
			type: "submission" | "grade" | "assignment";
			title: string;
			courseName: string;
			date: Date;
			grade?: number;
		}>;
	};
	loading?: boolean;
}

const upcomingColumns: ColumnDef<any>[] = [
	{
		accessorKey: "title",
		header: "Tarea",
		cell: ({ row }) => {
			const assignment = row.original;
			return (
				<div className="flex flex-col">
					<span className="font-medium">{assignment.title}</span>
					<span className="text-sm text-muted-foreground">
						{assignment.courseName}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "dueDate",
		header: "Fecha de Vencimiento",
		cell: ({ row }) => {
			const dueDate = row.original.dueDate;
			const isOverdue = new Date() > dueDate;
			return (
				<div className="flex items-center gap-2">
					{isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
					<span className={isOverdue ? "text-red-600" : ""}>
						{formatDistanceToNow(dueDate, { addSuffix: true })}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "isSubmitted",
		header: "Estado",
		cell: ({ row }) => {
			const { isSubmitted, isLate } = row.original;
			if (isSubmitted) {
				return (
					<Badge variant={isLate ? "destructive" : "default"}>
						{isLate ? "Entregado Tarde" : "Entregado"}
					</Badge>
				);
			}
			return <Badge variant="secondary">Pendiente</Badge>;
		},
	},
	{
		id: "actions",
		header: "Acciones",
		cell: ({ row }) => {
			const assignment = row.original;
			return (
				<Button
					size="sm"
					variant={assignment.isSubmitted ? "outline" : "default"}
				>
					{assignment.isSubmitted ? "Ver" : "Entregar"}
				</Button>
			);
		},
	},
];

const activityColumns: ColumnDef<any>[] = [
	{
		accessorKey: "type",
		header: "Tipo",
		cell: ({ row }) => {
			const type = row.original.type as 'submission' | 'grade' | 'assignment';
			const icons = {
				submission: FileText,
				grade: Trophy,
				assignment: BookOpen,
			};
			const labels = {
				submission: "Entrega",
				grade: "Calificación",
				assignment: "Tarea",
			};
			const Icon = icons[type as keyof typeof icons];
			return (
				<div className="flex items-center gap-2">
					<Icon className="h-4 w-4" />
					<span className="capitalize">{labels[type] ?? type}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "title",
		header: "Actividad",
		cell: ({ row }) => {
			const activity = row.original;
			return (
				<div className="flex flex-col">
					<span className="font-medium">{activity.title}</span>
					<span className="text-sm text-muted-foreground">
						{activity.courseName}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "date",
		header: "Fecha",
		cell: ({ row }) => {
			const date = row.original.date;
			return <span>{formatDistanceToNow(date, { addSuffix: true })}</span>;
		},
	},
	{
		accessorKey: "grade",
		header: "Nota",
		cell: ({ row }) => {
			const grade = row.original.grade;
			if (grade === undefined)
				return <span className="text-muted-foreground">-</span>;
			return (
				<Badge
					variant={
						grade >= 80 ? "default" : grade >= 60 ? "secondary" : "destructive"
					}
				>
					{grade}%
				</Badge>
			);
		},
	},
];

export function StudentOverview({
	studentId,
	data,
	loading,
}: StudentOverviewProps) {
	if (loading) {
		return (
			<div className="space-y-6">
				<LoadingState title="Loading your dashboard..." />
			</div>
		);
	}

	const { overallMetrics, courseProgress, upcomingDeadlines, recentActivity } =
		data;

	// Prepare chart data
	const progressChartData = courseProgress.map((course) => ({
		name:
			course.courseName.length > 15
				? course.courseName.substring(0, 15) + "..."
				: course.courseName,
		completion: Math.round(course.completionRate),
		grade: course.averageGrade || 0,
	}));

	// Risk level colors
	const getRiskColor = (level: string) => {
		switch (level) {
			case "high":
				return "danger";
			case "medium":
				return "warning";
			default:
				return "success";
		}
	};

	return (
		<div className="space-y-8">
			{/* Dashboard Header */}
			<div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background border-b border-border px-4 py-6 rounded-xl shadow-sm">
				<div className="flex items-center gap-3">
					<div>
						<h2 className="text-2xl font-extrabold text-foreground leading-tight mb-1">
							¡Bienvenido de nuevo! 👋
						</h2>
						<p className="text-sm text-muted-foreground font-medium">
							Tienes {upcomingDeadlines.filter((d) => !d.isSubmitted).length}{" "}
							tareas pendientes
							{overallMetrics.lastActivity && (
								<span className="ml-2">
									• Última actividad:{" "}
									{formatDistanceToNow(overallMetrics.lastActivity, {
										addSuffix: true,
									})}
								</span>
							)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<ThemeToggle />
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Progreso General"
					value={`${Math.round(overallMetrics.completionRate)}%`}
					icon={TrendingUp}
					progress={{
						value: overallMetrics.completedAssignments,
						max: overallMetrics.totalAssignments,
					}}
					variant={
						overallMetrics.completionRate >= 80
							? "success"
							: overallMetrics.completionRate >= 60
								? "warning"
								: "danger"
					}
				/>

				<StatCard
					title="Nota Promedio"
					value={
						overallMetrics.averageGrade
							? `${Math.round(overallMetrics.averageGrade)}%`
							: "N/A"
					}
					icon={Trophy}
					description={
						overallMetrics.averageGrade
							? "En todos los cursos"
							: "Sin notas aún"
					}
					variant={
						overallMetrics.averageGrade && overallMetrics.averageGrade >= 80
							? "success"
							: overallMetrics.averageGrade && overallMetrics.averageGrade >= 60
								? "warning"
								: "danger"
					}
				/>

				<StatCard
					title="A Tiempo"
					value={`${Math.round(overallMetrics.onTimeSubmissionRate)}%`}
					icon={Clock}
					description="Entregas a tiempo"
					variant={
						overallMetrics.onTimeSubmissionRate >= 90
							? "success"
							: overallMetrics.onTimeSubmissionRate >= 70
								? "warning"
								: "danger"
					}
				/>

				<StatCard
					title="Cursos Activos"
					value={courseProgress.length}
					icon={BookOpen}
					description="Actualmente inscripto"
				/>
			</div>

			{/* Course Progress Chart */}
			{courseProgress.length > 0 ? (
				<div className="grid gap-6 md:grid-cols-2">
					<div className="bg-background rounded-xl border border-border shadow p-4 flex flex-col justify-between">
						<ProgressChart
							data={progressChartData}
							title="Progreso por Curso"
							description="Porcentaje completado por curso"
						/>
					</div>
					<div className="bg-background rounded-xl border border-border shadow p-4 flex flex-col justify-between">
						<CardHeader>
							<CardTitle className="text-foreground">
								Estado de Cursos
							</CardTitle>
							<CardDescription className="text-muted-foreground">
								Riesgo y avance de cada curso
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{courseProgress.map((course) => (
									<div
										key={course.courseId}
										className="flex items-center justify-between p-3 border rounded-lg bg-muted/40"
									>
										<div className="flex-1">
											<h4 className="font-medium text-foreground">
												{course.courseName}
											</h4>
											<p className="text-sm text-muted-foreground">
												{course.completedAssignments} de{" "}
												{course.totalAssignments} tareas completadas
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant={getRiskColor(course.riskLevel) as any}>
												{course.riskLevel} riesgo
											</Badge>
											<span className="text-sm font-medium">
												{Math.round(course.completionRate)}%
											</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</div>
				</div>
			) : (
				<EmptyState
					icon={BookOpen}
					title="Sin cursos"
					description="No estás inscripto en ningún curso. Contacta a tu coordinador para comenzar."
				/>
			)}

			{/* Upcoming Deadlines */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Próximos Vencimientos
					</CardTitle>
					<CardDescription>
						Tus próximas tareas y sus fechas límite
					</CardDescription>
				</CardHeader>
				<CardContent>
					{upcomingDeadlines.length > 0 ? (
						<DataTable
							columns={upcomingColumns}
							data={upcomingDeadlines}
							searchKey="title"
							searchPlaceholder="Buscar tareas..."
						/>
					) : (
						<EmptyState
							icon={CheckCircle}
							title="¡Sin pendientes!"
							description="No tienes tareas próximas por entregar."
						/>
					)}
				</CardContent>
			</Card>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle>Actividad Reciente</CardTitle>
					<CardDescription>
						Tus últimas entregas y calificaciones
					</CardDescription>
				</CardHeader>
				<CardContent>
					{recentActivity.length > 0 ? (
						<DataTable
							columns={activityColumns}
							data={recentActivity}
							showColumnVisibility={false}
						/>
					) : (
						<EmptyState
							icon={FileText}
							title="Sin actividad reciente"
							description="Tus últimas entregas y calificaciones aparecerán aquí."
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
