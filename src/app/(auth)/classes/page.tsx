import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Calendar,
  Plus,
  Eye,
  Settings,
  UserPlus,
  ClipboardList,
  BarChart3,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface Student {
  id: string;
  name: string;
  email: string;
  averageGrade: number;
  completedAssignments: number;
  totalAssignments: number;
  lastActivity: Date;
  status: 'active' | 'inactive' | 'at_risk';
}

interface ClassData {
  id: string;
  name: string;
  section: string;
  description: string;
  room: string | null;
  state: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  enrollmentCount: number;
  totalAssignments: number;
  averageGrade: number;
  completionRate: number;
  students: Student[];
  recentActivity: string[];
  upcomingAssignments: number;
  startDate: Date | null;
  endDate: Date | null;
}

interface ClassesData {
  classes: ClassData[];
  userRole: 'teacher' | 'coordinator';
  stats: {
    totalClasses: number;
    totalStudents: number;
    averageGrade: number;
    activeAssignments: number;
  };
}

async function getClassesData(): Promise<ClassesData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/classes`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { 
      classes: [], 
      userRole: 'teacher', 
      stats: { totalClasses: 0, totalStudents: 0, averageGrade: 0, activeAssignments: 0 } 
    };
  }
}

function getStudentStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'at_risk': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStudentStatusText(status: string) {
  switch (status) {
    case 'active': return 'Activo';
    case 'inactive': return 'Inactivo';
    case 'at_risk': return 'En Riesgo';
    default: return 'Desconocido';
  }
}

export default async function ClassesPage() {
  const { classes, userRole, stats } = await getClassesData();
  
  const activeClasses = classes.filter(c => c.state === 'ACTIVE');
  const archivedClasses = classes.filter(c => c.state === 'ARCHIVED');
  const draftClasses = classes.filter(c => c.state === 'DRAFT');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis Clases</h1>
          <p className="text-muted-foreground">
            {userRole === "teacher" && "Gestiona tus clases y estudiantes"}
            {userRole === "coordinator" && "Vista general de todas las clases"}
          </p>
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Clase
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
                <p className="text-sm text-muted-foreground">Clases Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-muted-foreground">Total Estudiantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.averageGrade}%</p>
                <p className="text-sm text-muted-foreground">Promedio General</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeAssignments}</p>
                <p className="text-sm text-muted-foreground">Tareas Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Activas ({activeClasses.length})</TabsTrigger>
          <TabsTrigger value="draft">Borradores ({draftClasses.length})</TabsTrigger>
          <TabsTrigger value="archived">Archivadas ({archivedClasses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <ClassesList classes={activeClasses} />
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <ClassesList classes={draftClasses} />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <ClassesList classes={archivedClasses} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ClassesList({ classes }: { classes: ClassData[] }) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No hay clases</h3>
        <p className="mt-2 text-muted-foreground">
          Comienza creando tu primera clase para gestionar estudiantes.
        </p>
        <Button className="mt-4 gap-2">
          <Plus className="h-4 w-4" />
          Crear Clase
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {classes.map((classData) => (
        <Card key={classData.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  {classData.name}
                </CardTitle>
                <CardDescription>{classData.section}</CardDescription>
              </div>
              <Badge variant={classData.state === "ACTIVE" ? "default" : classData.state === "DRAFT" ? "secondary" : "outline"}>
                {classData.state === "ACTIVE" ? "Activa" : classData.state === "DRAFT" ? "Borrador" : "Archivada"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {classData.description}
            </p>
            
            {/* Class Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{classData.enrollmentCount}</p>
                <p className="text-xs text-muted-foreground">Estudiantes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{classData.averageGrade}%</p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{classData.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completitud</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{classData.totalAssignments}</p>
                <p className="text-xs text-muted-foreground">Tareas</p>
              </div>
            </div>

            {/* Students Overview */}
            {classData.students.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Estudiantes Destacados
                </h4>
                <div className="grid gap-2">
                  {classData.students.slice(0, 3).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">{student.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.completedAssignments}/{student.totalAssignments} tareas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStudentStatusColor(student.status)}>
                          {getStudentStatusText(student.status)}
                        </Badge>
                        <span className="text-sm font-medium">{student.averageGrade}%</span>
                      </div>
                    </div>
                  ))}
                  {classData.students.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      y {classData.students.length - 3} estudiantes más...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Ver clase
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Estudiantes ({classData.enrollmentCount})
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Tareas
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Calificaciones
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </div>

            {/* Quick Actions */}
            {classData.state === "ACTIVE" && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" className="flex-1 gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Tarea
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invitar Estudiante
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
