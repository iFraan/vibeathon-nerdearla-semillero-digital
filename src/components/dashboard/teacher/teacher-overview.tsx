"use client";

import { StatCard } from "@/components/ui/stat-card";
import { ProgressChart, AreaChartComponent } from "@/components/ui/charts";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Eye,
  MessageSquare
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";

interface TeacherOverviewProps {
  teacherId: string;
  data: {
    overview: {
      totalStudents: number;
      totalAssignments: number;
      pendingSubmissions: number;
      courses: Array<{
        courseId: string;
        courseName: string;
        totalStudents: number;
        activeStudents: number;
        averageCompletion: number;
        averageGrade: number | null;
        studentsAtRisk: number;
      }>;
    };
    pendingSubmissions: Array<{
      id: string;
      studentName: string;
      courseName: string;
      assignmentTitle: string;
      submittedAt: Date;
      isLate: boolean;
      studentEmail: string;
    }>;
    studentsAtRisk: Array<{
      id: string;
      name: string;
      email: string;
      courseName: string;
      riskLevel: 'high' | 'medium';
      completionRate: number;
      averageGrade: number | null;
      missedAssignments: number;
    }>;
    recentActivity: Array<{
      id: string;
      type: 'submission' | 'question' | 'late';
      studentName: string;
      courseName: string;
      description: string;
      date: Date;
    }>;
  };
  loading?: boolean;
}

const submissionsColumns: ColumnDef<any>[] = [
   {
     accessorKey: "studentName",
     header: "Estudiante",
     cell: ({ row }) => {
       const submission = row.original;
       return (
         <div className="flex flex-col">
           <span className="font-medium">{submission.studentName}</span>
           <span className="text-sm text-muted-foreground">{submission.studentEmail}</span>
         </div>
       );
     },
   },
   {
     accessorKey: "assignmentTitle",
     header: "Tarea",
     cell: ({ row }) => {
       const submission = row.original;
       return (
         <div className="flex flex-col">
           <span className="font-medium">{submission.assignmentTitle}</span>
           <span className="text-sm text-muted-foreground">{submission.courseName}</span>
         </div>
       );
     },
   },
   {
     accessorKey: "submittedAt",
     header: "Entregado",
     cell: ({ row }) => {
       const { submittedAt, isLate } = row.original;
       return (
         <div className="flex items-center gap-2">
           {isLate && <AlertTriangle className="h-4 w-4 text-orange-500" />}
           <span className={isLate ? "text-orange-600" : ""}>
             {formatDistanceToNow(submittedAt, { addSuffix: true })}
           </span>
         </div>
       );
     },
   },
   {
     id: "actions",
     header: "Acciones",
     cell: ({ row }) => (
       <div className="flex gap-2">
         <Button size="sm" variant="outline">
           <Eye className="h-4 w-4 mr-1" />
           Revisar
         </Button>
       </div>
     ),
   },
 ];

const riskStudentsColumns: ColumnDef<any>[] = [
   {
     accessorKey: "name",
     header: "Estudiante",
     cell: ({ row }) => {
       const student = row.original;
       return (
         <div className="flex flex-col">
           <span className="font-medium">{student.name}</span>
           <span className="text-sm text-muted-foreground">{student.email}</span>
         </div>
       );
     },
   },
   {
     accessorKey: "courseName",
     header: "Curso",
   },
   {
     accessorKey: "riskLevel",
     header: "Nivel de Riesgo",
     cell: ({ row }) => {
       const level = row.original.riskLevel;
       return (
         <Badge variant={level === "high" ? "destructive" : "secondary"}>
           {level} riesgo
         </Badge>
       );
     },
   },
   {
     accessorKey: "completionRate",
     header: "Finalización",
     cell: ({ row }) => {
       const rate = row.original.completionRate;
       return (
         <div className="flex items-center gap-2">
           <span>{Math.round(rate)}%</span>
           <div className="w-12 bg-gray-200 rounded-full h-2">
             <div
               className={`h-2 rounded-full ${rate >= 75 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
               style={{ width: `${rate}%` }}
             />
           </div>
         </div>
       );
     },
   },
   {
     id: "actions",
     header: "Acciones",
     cell: ({ row }) => (
       <div className="flex gap-2">
         <Button size="sm" variant="outline">
           <MessageSquare className="h-4 w-4 mr-1" />
           Contactar
         </Button>
       </div>
     ),
   },
 ];

export function TeacherOverview({ teacherId, data, loading }: TeacherOverviewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState title="Loading your teaching dashboard..." />
      </div>
    );
  }

  const { overview, pendingSubmissions, studentsAtRisk, recentActivity } = data;

  // Prepare chart data
  const courseProgressData = overview.courses.map(course => ({
    name: course.courseName.length > 15 ? course.courseName.substring(0, 15) + '...' : course.courseName,
    completion: Math.round(course.averageCompletion),
    students: course.totalStudents,
    active: course.activeStudents
  }));

  const activityData = recentActivity.slice(0, 7).map(activity => ({
    date: activity.date.toLocaleDateString(),
    submissions: recentActivity.filter(a => 
      a.type === 'submission' && 
      a.date.toDateString() === activity.date.toDateString()
    ).length,
    questions: recentActivity.filter(a => 
      a.type === 'question' && 
      a.date.toDateString() === activity.date.toDateString()
    ).length,
  }));

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background border-b border-border px-4 py-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground leading-tight mb-1">
              Dashboard de Profesor 📚
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Tienes {pendingSubmissions.length} entregas por revisar
              {studentsAtRisk.length > 0 && (
                <span className="ml-2">
                  • {studentsAtRisk.length} estudiantes necesitan atención
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Estudiantes"
          value={overview.totalStudents}
          icon={Users}
          description="En todos los cursos"
        />
        
        <StatCard
          title="Cursos Activos"
          value={overview.courses.length}
          icon={BookOpen}
          description="Actualmente enseñando"
        />
        
        <StatCard
          title="Por Revisar"
          value={pendingSubmissions.length}
          icon={FileText}
          variant={pendingSubmissions.length > 10 ? "warning" : "default"}
          description="Entregas pendientes"
        />
        
        <StatCard
          title="Estudiantes en Riesgo"
          value={studentsAtRisk.length}
          icon={AlertTriangle}
          variant={studentsAtRisk.length > 0 ? "danger" : "success"}
          description="Necesitan atención"
        />
      </div>

      {/* Course Overview */}
      {overview.courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-background rounded-xl border border-border shadow p-4 flex flex-col justify-between">
            <ProgressChart
              data={courseProgressData}
              title="Rendimiento por Curso"
              description="Tasa de finalización promedio por curso"
            />
          </div>
          
          <div className="bg-background rounded-xl border border-border shadow">
            <CardHeader>
              <CardTitle className="text-foreground">Resumen de Clases</CardTitle>
              <CardDescription className="text-muted-foreground">Participación y rendimiento estudiantil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.courses.map((course) => (
                  <div key={course.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{course.courseName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{course.totalStudents} estudiantes</span>
                        <span>{course.activeStudents} activos</span>
                        {course.studentsAtRisk > 0 && (
                          <span className="text-red-600">{course.studentsAtRisk} en riesgo</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{Math.round(course.averageCompletion)}%</div>
                      {course.averageGrade && (
                        <div className="text-sm text-muted-foreground">
                          Avg: {Math.round(course.averageGrade)}%
                        </div>
                      )}
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
          title="Sin cursos asignados"
          description="Aún no tienes cursos asignados para enseñar."
        />
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">
            Entregas Pendientes ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="students">
            Estudiantes en Riesgo ({studentsAtRisk.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            Actividad Reciente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Entregas Pendientes
              </CardTitle>
              <CardDescription>
                Entregas de estudiantes esperando revisión
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSubmissions.length > 0 ? (
                <DataTable
                  columns={submissionsColumns}
                  data={pendingSubmissions}
                  searchKey="studentName"
                  searchPlaceholder="Search students..."
                />
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title="¡Todo al día!"
                  description="No hay entregas esperando revisión."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Estudiantes Necesitando Atención
              </CardTitle>
              <CardDescription>
                Estudiantes que pueden estar luchando o atrasados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentsAtRisk.length > 0 ? (
                <DataTable
                  columns={riskStudentsColumns}
                  data={studentsAtRisk}
                  searchKey="name"
                  searchPlaceholder="Search students..."
                />
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title="¡Todos los estudiantes en camino!"
                  description="No hay estudiantes marcados como en riesgo actualmente."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas interacciones y entregas</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-1 rounded-full bg-blue-100">
                        {activity.type === 'submission' && <FileText className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'question' && <MessageSquare className="h-4 w-4 text-green-600" />}
                        {activity.type === 'late' && <Clock className="h-4 w-4 text-orange-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{activity.studentName}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(activity.date, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.courseName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="Sin actividad reciente"
                  description="La actividad de estudiantes aparecerá aquí."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
