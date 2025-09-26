import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  Plus,
  Eye,
  TrendingUp,
} from "lucide-react"
import { api } from "@/trpc/server";

interface CourseData {
  id: string;
  name: string;
  section: string;
  description: string;
  room: string | null;
  state: string;
  enrollmentCount: number;
  activeAssignments: number;
  startDate: string | null;
  endDate: string | null;
  completionRate: number;
  averageGrade: number;
  alternateLink: string | null;
}

interface StatsData {
  totalCourses: number;
  totalStudents: number;
  totalActiveAssignments: number;
  averageCompletion: number;
}

interface CoursesResponse {
  courses: CourseData[];
  userRole: 'student' | 'teacher' | 'coordinator';
  stats?: StatsData;
}

function isCoordinator(data: CoursesResponse): data is CoursesResponse & { userRole: "coordinator"; stats: StatsData } {
  return data.userRole === "coordinator" && !!data.stats;
}

export default async function CoursesPage() {
  const data = await api.courses.list();
  const { courses, userRole } = data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cursos</h1>
          <p className="text-muted-foreground">
            {userRole === "student" && "Tus cursos activos y progreso"}
            {userRole === "teacher" && "Gestiona tus clases y estudiantes"}
            {userRole === "coordinator" && "Vista general de todos los cursos"}
          </p>
        </div>

        {(userRole === "teacher" || userRole === "coordinator") && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Curso
          </Button>
        )}
      </div>

      {/* Stats Overview for Coordinators */}
      {isCoordinator(data) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{data.stats.totalCourses}</p>
                  <p className="text-sm text-muted-foreground">Cursos Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{data.stats.totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Estudiantes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{data.stats.averageCompletion}%</p>
                  <p className="text-sm text-muted-foreground">Promedio Completitud</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{data.stats.totalActiveAssignments}</p>
                  <p className="text-sm text-muted-foreground">Tareas Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription>{course.section}</CardDescription>
                </div>
                <Badge variant={course.state === "ACTIVE" ? "default" : "secondary"}>
                  {course.state}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 h-full justify-between">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {course.description}
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course.enrollmentCount} estudiantes</span>
                  </div>


                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{course.activeAssignments} tareas activas</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{course.startDate ? new Date(course.startDate).toLocaleDateString() : 'Sin fecha'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>{course.completionRate}% completado</span>
                  </div>
                </div>

                {/* Role-specific progress indicators */}
                {userRole === "student" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tu progreso</span>
                      <span>{course.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${course.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}

                {userRole === "teacher" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Promedio clase</span>
                      <span>{course.averageGrade}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${course.averageGrade}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons based on role */}
                <div className="flex gap-2 pt-2 justify-end">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Eye className="h-4 w-4" />
                    Ver curso
                  </Button>

                  {userRole === "teacher" && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Gestionar
                    </Button>
                  )}

                  {userRole === "coordinator" && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay cursos disponibles</h3>
          <p className="mt-2 text-muted-foreground">
            {userRole === "student" && "Aún no estás inscrito en ningún curso."}
            {userRole === "teacher" && "Comienza creando tu primer curso."}
            {userRole === "coordinator" && "No hay cursos en el sistema."}
          </p>
          {(userRole === "teacher" || userRole === "coordinator") && (
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Crear Curso
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
