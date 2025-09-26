import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Users,
  FileText,
  BookOpen
} from "lucide-react"

interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  dueDate: Date;
  maxPoints: number;
  submissionStatus?: 'not_submitted' | 'submitted' | 'graded' | 'late';
  grade?: number;
  submittedAt?: Date;
  submissionCount?: number;
  totalStudents?: number;
  averageGrade?: number;
  type: 'assignment' | 'quiz' | 'project';
  instructions?: string;
}

interface AssignmentsData {
  assignments: Assignment[];
  userRole: 'student' | 'teacher' | 'coordinator';
  stats: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  };
}

async function getAssignmentsData(): Promise<AssignmentsData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/assignments`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch assignments');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return { 
      assignments: [], 
      userRole: 'student', 
      stats: { total: 0, pending: 0, completed: 0, overdue: 0 } 
    };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'graded': return 'bg-green-100 text-green-800';
    case 'late': return 'bg-red-100 text-red-800';
    case 'not_submitted': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'submitted': return 'Entregado';
    case 'graded': return 'Calificado';
    case 'late': return 'Retrasado';
    case 'not_submitted': return 'Pendiente';
    default: return 'Desconocido';
  }
}

export default async function AssignmentsPage() {
  const { assignments, userRole, stats } = await getAssignmentsData();
  const isOverdue = (dueDate: Date) => new Date() > new Date(dueDate);
  
  const pendingAssignments = assignments.filter(a => 
    userRole === 'student' 
      ? a.submissionStatus === 'not_submitted' 
      : (a.submissionCount || 0) < (a.totalStudents || 1)
  );
  
  const completedAssignments = assignments.filter(a => 
    userRole === 'student' 
      ? a.submissionStatus === 'submitted' || a.submissionStatus === 'graded'
      : (a.submissionCount || 0) === (a.totalStudents || 0)
  );
  
  const overdueAssignments = assignments.filter(a => 
    userRole === 'student' 
      ? a.submissionStatus === 'not_submitted' && isOverdue(a.dueDate)
      : isOverdue(a.dueDate) && (a.submissionCount || 0) < (a.totalStudents || 1)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tareas</h1>
          <p className="text-muted-foreground">
            {userRole === "student" && "Gestiona tus tareas y entregas"}
            {userRole === "teacher" && "Crea y gestiona tareas para tus estudiantes"}
            {userRole === "coordinator" && "Vista general de todas las tareas"}
          </p>
        </div>
        
        {(userRole === "teacher" || userRole === "coordinator") && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas ({assignments.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({pendingAssignments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completadas ({completedAssignments.length})</TabsTrigger>
          <TabsTrigger value="overdue">Atrasadas ({overdueAssignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <AssignmentsList assignments={assignments} userRole={userRole} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <AssignmentsList assignments={pendingAssignments} userRole={userRole} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <AssignmentsList assignments={completedAssignments} userRole={userRole} />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <AssignmentsList assignments={overdueAssignments} userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AssignmentsList({ assignments, userRole }: { assignments: Assignment[], userRole: string }) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No hay tareas</h3>
        <p className="mt-2 text-muted-foreground">
          {userRole === "student" && "No tienes tareas en esta categoría."}
          {userRole === "teacher" && "Comienza creando tu primera tarea."}
          {userRole === "coordinator" && "No hay tareas en el sistema."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {assignment.type === 'quiz' && <ClipboardList className="h-4 w-4 text-blue-600" />}
                  {assignment.type === 'project' && <BookOpen className="h-4 w-4 text-purple-600" />}
                  {assignment.type === 'assignment' && <FileText className="h-4 w-4 text-green-600" />}
                  {assignment.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span>{assignment.courseName}</span>
                  <span>•</span>
                  <span>{assignment.maxPoints} puntos</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {userRole === "student" && assignment.submissionStatus && (
                  <Badge className={getStatusColor(assignment.submissionStatus)}>
                    {getStatusText(assignment.submissionStatus)}
                  </Badge>
                )}
                {userRole !== "student" && (
                  <Badge variant="outline">
                    {assignment.submissionCount || 0}/{assignment.totalStudents || 0} entregas
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {assignment.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Vence: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              </div>
              
              {userRole === "student" && assignment.submittedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Entregado: {new Date(assignment.submittedAt).toLocaleDateString()}</span>
                </div>
              )}
              
              {userRole === "student" && assignment.grade !== undefined && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Calificación: {assignment.grade}/{assignment.maxPoints}</span>
                </div>
              )}
              
              {userRole !== "student" && assignment.averageGrade !== undefined && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Promedio: {assignment.averageGrade.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Action buttons based on role */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Eye className="h-4 w-4" />
                Ver detalles
              </Button>
              
              {userRole === "student" && assignment.submissionStatus === 'not_submitted' && (
                <Button size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Entregar
                </Button>
              )}
              
              {userRole === "teacher" && (
                <>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    Entregas
                  </Button>
                </>
              )}
              
              {userRole === "coordinator" && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Ver entregas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
