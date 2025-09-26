import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Target,
  Calendar,
  CheckCircle,
  Clock,
  BarChart3,
  Star,
  Trophy,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"

interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  grade: number;
  completedAssignments: number;
  totalAssignments: number;
  lastActivity: Date;
  nextDeadline?: {
    assignmentTitle: string;
    dueDate: Date;
  };
  trending: 'up' | 'down' | 'stable';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: Date;
  type: 'milestone' | 'grade' | 'completion' | 'consistency';
  icon: string;
  courseName?: string;
}

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  isCompleted: boolean;
  courseName: string;
}

interface ProgressData {
  overallProgress: number;
  overallGrade: number;
  totalPoints: number;
  earnedPoints: number;
  courses: CourseProgress[];
  achievements: Achievement[];
  learningGoals: LearningGoal[];
  stats: {
    completedAssignments: number;
    totalAssignments: number;
    onTimeSubmissions: number;
    averageGrade: number;
    studyStreak: number;
    weeklyHours: number;
  };
  weeklyProgress: {
    week: string;
    progress: number;
    grade: number;
    assignments: number;
  }[];
}

async function getProgressData(): Promise<ProgressData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/progress`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch progress data');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching progress:', error);
    return {
      overallProgress: 0,
      overallGrade: 0,
      totalPoints: 0,
      earnedPoints: 0,
      courses: [],
      achievements: [],
      learningGoals: [],
      stats: { completedAssignments: 0, totalAssignments: 0, onTimeSubmissions: 0, averageGrade: 0, studyStreak: 0, weeklyHours: 0 },
      weeklyProgress: []
    };
  }
}

function getTrendingIcon(trending: string) {
  switch (trending) {
    case 'up': return <ArrowUp className="h-3 w-3 text-green-600" />;
    case 'down': return <ArrowDown className="h-3 w-3 text-red-600" />;
    default: return <Minus className="h-3 w-3 text-gray-600" />;
  }
}

function getAchievementIcon(type: string) {
  switch (type) {
    case 'milestone': return <Trophy className="h-5 w-5 text-yellow-600" />;
    case 'grade': return <Award className="h-5 w-5 text-blue-600" />;
    case 'completion': return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'consistency': return <Zap className="h-5 w-5 text-purple-600" />;
    default: return <Star className="h-5 w-5 text-gray-600" />;
  }
}

export default async function ProgressPage() {
  const progressData = await getProgressData();

  const recentAchievements = progressData.achievements.slice(0, 6);
  const activeGoals = progressData.learningGoals.filter(g => !g.isCompleted);
  const completedGoals = progressData.learningGoals.filter(g => g.isCompleted);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mi Progreso</h1>
          <p className="text-muted-foreground">
            Seguimiento de tu rendimiento académico y objetivos de aprendizaje
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Target className="h-4 w-4" />
            Establecer Meta
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reporte Detallado
          </Button>
        </div>
      </div>

      {/* Overall Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progreso General</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{progressData.overallProgress}%</div>
                <Progress value={progressData.overallProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Promedio General</span>
                <Award className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{progressData.overallGrade}%</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Puntos Obtenidos</span>
                <Star className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {progressData.earnedPoints}/{progressData.totalPoints}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Racha de Estudio</span>
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{progressData.stats.studyStreak}</div>
              <div className="text-xs text-muted-foreground">días consecutivos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estadísticas de Rendimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Tareas Completadas</span>
                <span className="font-medium">{progressData.stats.completedAssignments}/{progressData.stats.totalAssignments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Entregas Puntuales</span>
                <span className="font-medium text-green-600">{progressData.stats.onTimeSubmissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Promedio General</span>
                <span className="font-medium text-blue-600">{progressData.stats.averageGrade}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Horas Semanales</span>
                <span className="font-medium">{progressData.stats.weeklyHours}h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Logros Recientes</CardTitle>
            <CardDescription>Tus últimos reconocimientos académicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAchievementIcon(achievement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {achievement.courseName && (
                        <Badge variant="outline" className="text-xs">
                          {achievement.courseName}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed progress */}
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">Progreso por Curso</TabsTrigger>
          <TabsTrigger value="goals">Objetivos de Aprendizaje</TabsTrigger>
          <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4">
            {progressData.courses.map((course) => (
              <Card key={course.courseId}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          {course.courseName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {course.completedAssignments}/{course.totalAssignments} tareas completadas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendingIcon(course.trending)}
                        <Badge variant="outline" className="font-medium">
                          {course.grade}%
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso del curso</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>

                    {course.nextDeadline && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-800">
                          Próxima entrega: <strong>{course.nextDeadline.assignmentTitle}</strong> - 
                          {new Date(course.nextDeadline.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Última actividad: {new Date(course.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Objetivos Activos</CardTitle>
                <CardDescription>Metas que estás trabajando actualmente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeGoals.length > 0 ? (
                  activeGoals.map((goal) => (
                    <div key={goal.id} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                          <Badge variant="outline">{goal.courseName}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{goal.progress}%</div>
                          <div className="text-xs text-muted-foreground">
                            Meta: {new Date(goal.targetDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No tienes objetivos activos. ¡Establece uno nuevo!
                  </p>
                )}
              </CardContent>
            </Card>

            {completedGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Objetivos Completados</CardTitle>
                  <CardDescription>Metas que has logrado exitosamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800">{goal.title}</p>
                        <p className="text-sm text-green-600">{goal.courseName}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Completado</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progreso Semanal</CardTitle>
              <CardDescription>Tu evolución a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.weeklyProgress.map((week, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                    <div className="text-sm font-medium">{week.week}</div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Progreso: </span>
                      <span className="font-medium">{week.progress}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Promedio: </span>
                      <span className="font-medium">{week.grade}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Tareas: </span>
                      <span className="font-medium">{week.assignments}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
