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
    header: "Student",
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
    header: "Assignment",
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
    header: "Submitted",
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
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" />
          Review
        </Button>
      </div>
    ),
  },
];

const riskStudentsColumns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Student",
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
    header: "Course",
  },
  {
    accessorKey: "riskLevel",
    header: "Risk Level",
    cell: ({ row }) => {
      const level = row.original.riskLevel;
      return (
        <Badge variant={level === "high" ? "destructive" : "secondary"}>
          {level} risk
        </Badge>
      );
    },
  },
  {
    accessorKey: "completionRate",
    header: "Completion",
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
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          <MessageSquare className="h-4 w-4 mr-1" />
          Contact
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
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Teaching Dashboard 📚</h2>
        <p className="text-green-100">
          You have {pendingSubmissions.length} submissions to review
          {studentsAtRisk.length > 0 && (
            <span className="ml-2">
              • {studentsAtRisk.length} students need attention
            </span>
          )}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={overview.totalStudents}
          icon={Users}
          description="Across all courses"
        />
        
        <StatCard
          title="Active Courses"
          value={overview.courses.length}
          icon={BookOpen}
          description="Currently teaching"
        />
        
        <StatCard
          title="Pending Reviews"
          value={pendingSubmissions.length}
          icon={FileText}
          variant={pendingSubmissions.length > 10 ? "warning" : "default"}
          description="Submissions to grade"
        />
        
        <StatCard
          title="Students at Risk"
          value={studentsAtRisk.length}
          icon={AlertTriangle}
          variant={studentsAtRisk.length > 0 ? "danger" : "success"}
          description="Need attention"
        />
      </div>

      {/* Course Overview */}
      {overview.courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <ProgressChart
            data={courseProgressData}
            title="Course Performance"
            description="Average completion rate by course"
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Class Summary</CardTitle>
              <CardDescription>Student engagement and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.courses.map((course) => (
                  <div key={course.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{course.courseName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{course.totalStudents} students</span>
                        <span>{course.activeStudents} active</span>
                        {course.studentsAtRisk > 0 && (
                          <span className="text-red-600">{course.studentsAtRisk} at risk</span>
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
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses assigned"
          description="You haven't been assigned to teach any courses yet."
        />
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">
            Pending Submissions ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="students">
            Students at Risk ({studentsAtRisk.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pending Submissions
              </CardTitle>
              <CardDescription>
                Student submissions waiting for your review
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
                  title="All caught up!"
                  description="No submissions waiting for review."
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
                Students Needing Attention
              </CardTitle>
              <CardDescription>
                Students who may be struggling or falling behind
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
                  title="All students on track!"
                  description="No students currently flagged as at risk."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions and submissions</CardDescription>
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
                  title="No recent activity"
                  description="Student activity will appear here."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
