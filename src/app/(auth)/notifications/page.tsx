import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  BellRing, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MessageCircle,
  BookOpen,
  Users,
  Calendar,
  Settings,
  RotateCcw,
  Trash2,
  Filter
} from "lucide-react"

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'grade' | 'announcement' | 'system' | 'reminder' | 'message';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: Date;
  courseId?: string;
  courseName?: string;
  actionUrl?: string;
  metadata?: {
    assignmentTitle?: string;
    grade?: number;
    maxPoints?: number;
    senderName?: string;
    dueDate?: Date;
  };
}

interface NotificationsData {
  notifications: Notification[];
  userRole: 'student' | 'teacher' | 'coordinator';
  stats: {
    total: number;
    unread: number;
    high_priority: number;
    today: number;
  };
}

async function getNotificationsData(): Promise<NotificationsData> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { 
      notifications: [], 
      userRole: 'student', 
      stats: { total: 0, unread: 0, high_priority: 0, today: 0 } 
    };
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'assignment': return <BookOpen className="h-4 w-4 text-blue-600" />;
    case 'grade': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'announcement': return <BellRing className="h-4 w-4 text-purple-600" />;
    case 'system': return <Settings className="h-4 w-4 text-gray-600" />;
    case 'reminder': return <Clock className="h-4 w-4 text-orange-600" />;
    case 'message': return <MessageCircle className="h-4 w-4 text-blue-600" />;
    default: return <Bell className="h-4 w-4 text-gray-600" />;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getPriorityText(priority: string) {
  switch (priority) {
    case 'urgent': return 'Urgente';
    case 'high': return 'Alta';
    case 'medium': return 'Media';
    case 'low': return 'Baja';
    default: return 'Normal';
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `hace ${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)}h`;
  if (diffInMinutes < 10080) return `hace ${Math.floor(diffInMinutes / 1440)}d`;
  return new Date(date).toLocaleDateString();
}

export default async function NotificationsPage() {
  const { notifications, userRole, stats } = await getNotificationsData();
  
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  const highPriorityNotifications = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayNotifications = notifications.filter(n => {
    const notificationDate = new Date(n.createdAt);
    notificationDate.setHours(0, 0, 0, 0);
    return notificationDate.getTime() === today.getTime();
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">
            Mantente al día con las actualizaciones de tus cursos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Marcar todo como leído
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-600" />
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
              <BellRing className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-sm text-muted-foreground">Sin Leer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.high_priority}</p>
                <p className="text-sm text-muted-foreground">Alta Prioridad</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Sin Leer ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value="priority">Importantes ({highPriorityNotifications.length})</TabsTrigger>
          <TabsTrigger value="today">Hoy ({todayNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <NotificationsList notifications={notifications} />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <NotificationsList notifications={unreadNotifications} />
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <NotificationsList notifications={highPriorityNotifications} />
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <NotificationsList notifications={todayNotifications} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationsList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No hay notificaciones</h3>
        <p className="mt-2 text-muted-foreground">
          Estás al día con todas tus notificaciones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`hover:shadow-md transition-all cursor-pointer ${
            !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Notification Icon */}
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              {/* Notification Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <Badge className={getPriorityColor(notification.priority)}>
                      {getPriorityText(notification.priority)}
                    </Badge>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{getTimeAgo(notification.createdAt)}</span>
                  
                  {notification.courseName && (
                    <>
                      <span>•</span>
                      <span>{notification.courseName}</span>
                    </>
                  )}
                  
                  {notification.metadata?.senderName && (
                    <>
                      <span>•</span>
                      <span>de {notification.metadata.senderName}</span>
                    </>
                  )}
                </div>

                {/* Additional Metadata */}
                {notification.metadata && (
                  <div className="space-y-1">
                    {notification.metadata.assignmentTitle && (
                      <p className="text-xs text-muted-foreground">
                        Tarea: {notification.metadata.assignmentTitle}
                      </p>
                    )}
                    
                    {notification.metadata.grade !== undefined && notification.metadata.maxPoints && (
                      <p className="text-xs">
                        <span className="text-green-600 font-medium">
                          Calificación: {notification.metadata.grade}/{notification.metadata.maxPoints}
                        </span>
                      </p>
                    )}
                    
                    {notification.metadata.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Vence: {new Date(notification.metadata.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {notification.actionUrl && (
                    <Button variant="outline" size="sm">
                      Ver detalles
                    </Button>
                  )}
                  
                  {!notification.isRead && (
                    <Button variant="ghost" size="sm" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Marcar como leído
                    </Button>
                  )}
                  
                  {notification.isRead && (
                    <Button variant="ghost" size="sm" className="gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Marcar como no leído
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
