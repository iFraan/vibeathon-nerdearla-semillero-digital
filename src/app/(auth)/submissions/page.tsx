import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  MessageSquare,
  User,
  Calendar,
  BookOpen,
  GraduationCap,
  Star,
  BarChart3
} from "lucide-react"

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  submittedAt: Date;
  status: 'submitted' | 'graded' | 'needs_revision' | 'late';
  grade?: number;
  maxPoints: number;
  feedback?: string;
  attachments: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  submissionText?: string;
  gradedAt?: Date;
  gradedBy?: string;
  isLate: boolean;
  attemptNumber: number;
}

interface SubmissionsData {
  submissions: Submission[];
  userRole: 'teacher' | 'coordinator';
  stats: {
    total: number;
    pending: number;
    graded: number;
    needs_revision: number;
    average_grade: number;
  };
}

async function getSubmissionsData(): Promise<SubmissionsData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/submissions`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch submissions');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return { 
      submissions: [], 
      userRole: 'teacher', 
      stats: { total: 0, pending: 0, graded: 0, needs_revision: 0, average_grade: 0 } 
    };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'graded': return 'bg-green-100 text-green-800';
    case 'needs_revision': return 'bg-yellow-100 text-yellow-800';
    case 'late': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'submitted': return 'Entregado';
    case 'graded': return 'Calificado';
    case 'needs_revision': return 'Requiere Revisión';
    case 'late': return 'Entregado Tarde';
    default: return 'Desconocido';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Hace menos de 1 hora';
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)} días`;
  return new Date(date).toLocaleDateString();
}

export default async function SubmissionsPage() {
  const { submissions, userRole, stats } = await getSubmissionsData();
  
  const pendingSubmissions = submissions.filter(s => s.status === 'submitted' || s.status === 'late');
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const needsRevisionSubmissions = submissions.filter(s => s.status === 'needs_revision');
  const recentSubmissions = submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 10);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Entregas de Estudiantes</h1>
          <p className="text-muted-foreground">
            {userRole === "teacher" && "Revisa y califica las entregas de tus estudiantes"}
            {userRole === "coordinator" && "Vista general de todas las entregas"}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Entregas</p>
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
                <p className="text-sm text-muted-foreground">Por Revisar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.graded}</p>
                <p className="text-sm text-muted-foreground">Calificadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.needs_revision}</p>
                <p className="text-sm text-muted-foreground">Necesitan Revisión</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.average_grade.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Por Revisar ({pendingSubmissions.length})</TabsTrigger>
          <TabsTrigger value="recent">Recientes ({recentSubmissions.length})</TabsTrigger>
          <TabsTrigger value="graded">Calificadas ({gradedSubmissions.length})</TabsTrigger>
          <TabsTrigger value="revision">Revisión ({needsRevisionSubmissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <SubmissionsList submissions={pendingSubmissions} showGradeAction={true} />
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <SubmissionsList submissions={recentSubmissions} showGradeAction={false} />
        </TabsContent>

        <TabsContent value="graded" className="space-y-4">
          <SubmissionsList submissions={gradedSubmissions} showGradeAction={false} />
        </TabsContent>

        <TabsContent value="revision" className="space-y-4">
          <SubmissionsList submissions={needsRevisionSubmissions} showGradeAction={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SubmissionsList({ submissions, showGradeAction }: { submissions: Submission[], showGradeAction: boolean }) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No hay entregas</h3>
        <p className="mt-2 text-muted-foreground">
          No hay entregas en esta categoría.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  {submission.studentName}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {submission.courseName}
                  </span>
                  <span>•</span>
                  <span>{submission.assignmentTitle}</span>
                  {submission.attemptNumber > 1 && (
                    <>
                      <span>•</span>
                      <span>Intento #{submission.attemptNumber}</span>
                    </>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {submission.isLate && (
                  <Badge variant="destructive" className="text-xs">
                    Retrasado
                  </Badge>
                )}
                <Badge className={getStatusColor(submission.status)}>
                  {getStatusText(submission.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Submission Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Entregado: {getTimeAgo(submission.submittedAt)}</span>
              </div>
              
              {submission.gradedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Calificado: {getTimeAgo(submission.gradedAt)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <span>
                  {submission.grade !== undefined 
                    ? `${submission.grade}/${submission.maxPoints} puntos` 
                    : `Máximo: ${submission.maxPoints} puntos`
                  }
                </span>
              </div>
            </div>

            {/* Submission Content Preview */}
            {submission.submissionText && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Texto de la entrega:</p>
                <p className="text-sm line-clamp-3">{submission.submissionText}</p>
              </div>
            )}

            {/* Attachments */}
            {submission.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Archivos adjuntos ({submission.attachments.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {submission.attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            {submission.feedback && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-1">Retroalimentación:</p>
                <p className="text-sm text-blue-800">{submission.feedback}</p>
              </div>
            )}

            {/* Grade Display */}
            {submission.grade !== undefined && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm text-green-900">Calificación Final:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-700">
                    {submission.grade}/{submission.maxPoints}
                  </span>
                  <span className="text-sm text-green-600">
                    ({((submission.grade / submission.maxPoints) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Ver completa
              </Button>
              
              {showGradeAction && submission.status !== 'graded' && (
                <Button size="sm" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Calificar
                </Button>
              )}
              
              {submission.status === 'graded' && (
                <Button variant="outline" size="sm" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Editar calificación
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentarios
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Descargar todo
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
