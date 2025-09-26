"use client";

import { StatCard } from "@/components/ui/stat-card";
import { ProgressChart, TrendChart } from "@/components/ui/charts";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";

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
      riskLevel: 'low' | 'medium' | 'high';
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
      type: 'submission' | 'grade' | 'assignment';
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
    header: "Assignment",
    cell: ({ row }) => {
      const assignment = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{assignment.title}</span>
          <span className="text-sm text-muted-foreground">{assignment.courseName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
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
    header: "Status",
    cell: ({ row }) => {
      const { isSubmitted, isLate } = row.original;
      if (isSubmitted) {
        return (
          <Badge variant={isLate ? "destructive" : "default"}>
            {isLate ? "Submitted Late" : "Submitted"}
          </Badge>
        );
      }
      return <Badge variant="secondary">Pending</Badge>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const assignment = row.original;
      return (
        <Button size="sm" variant={assignment.isSubmitted ? "outline" : "default"}>
          {assignment.isSubmitted ? "View" : "Submit"}
        </Button>
      );
    },
  },
];

const activityColumns: ColumnDef<any>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      const icons = {
        submission: FileText,
        grade: Trophy,
        assignment: BookOpen
      };
      const Icon = icons[type as keyof typeof icons];
      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="capitalize">{type}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Activity",
    cell: ({ row }) => {
      const activity = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{activity.title}</span>
          <span className="text-sm text-muted-foreground">{activity.courseName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.date;
      return <span>{formatDistanceToNow(date, { addSuffix: true })}</span>;
    },
  },
  {
    accessorKey: "grade",
    header: "Grade",
    cell: ({ row }) => {
      const grade = row.original.grade;
      if (grade === undefined) return <span className="text-muted-foreground">-</span>;
      return (
        <Badge variant={grade >= 80 ? "default" : grade >= 60 ? "secondary" : "destructive"}>
          {grade}%
        </Badge>
      );
    },
  },
];

export function StudentOverview({ studentId, data, loading }: StudentOverviewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState title="Loading your dashboard..." />
      </div>
    );
  }

  const { overallMetrics, courseProgress, upcomingDeadlines, recentActivity } = data;

  // Prepare chart data
  const progressChartData = courseProgress.map(course => ({
    name: course.courseName.length > 15 ? course.courseName.substring(0, 15) + '...' : course.courseName,
    completion: Math.round(course.completionRate),
    grade: course.averageGrade || 0
  }));

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
        <p className="text-blue-100">
          You have {upcomingDeadlines.filter(d => !d.isSubmitted).length} pending assignments
          {overallMetrics.lastActivity && (
            <span className="ml-2">
              • Last activity: {formatDistanceToNow(overallMetrics.lastActivity, { addSuffix: true })}
            </span>
          )}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Progress"
          value={`${Math.round(overallMetrics.completionRate)}%`}
          icon={TrendingUp}
          progress={{ 
            value: overallMetrics.completedAssignments, 
            max: overallMetrics.totalAssignments 
          }}
          variant={overallMetrics.completionRate >= 80 ? "success" : 
                  overallMetrics.completionRate >= 60 ? "warning" : "danger"}
        />
        
        <StatCard
          title="Average Grade"
          value={overallMetrics.averageGrade ? `${Math.round(overallMetrics.averageGrade)}%` : "N/A"}
          icon={Trophy}
          description={overallMetrics.averageGrade ? "Across all courses" : "No grades yet"}
          variant={overallMetrics.averageGrade && overallMetrics.averageGrade >= 80 ? "success" : 
                  overallMetrics.averageGrade && overallMetrics.averageGrade >= 60 ? "warning" : "danger"}
        />
        
        <StatCard
          title="On-Time Rate"
          value={`${Math.round(overallMetrics.onTimeSubmissionRate)}%`}
          icon={Clock}
          description="Submissions on time"
          variant={overallMetrics.onTimeSubmissionRate >= 90 ? "success" : 
                  overallMetrics.onTimeSubmissionRate >= 70 ? "warning" : "danger"}
        />
        
        <StatCard
          title="Active Courses"
          value={courseProgress.length}
          icon={BookOpen}
          description="Currently enrolled"
        />
      </div>

      {/* Course Progress Chart */}
      {courseProgress.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <ProgressChart
            data={progressChartData}
            title="Course Progress"
            description="Completion rate by course"
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Course Status</CardTitle>
              <CardDescription>Risk assessment for each course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseProgress.map((course) => (
                  <div key={course.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{course.courseName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {course.completedAssignments} of {course.totalAssignments} assignments completed
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRiskColor(course.riskLevel) as any}>
                        {course.riskLevel} risk
                      </Badge>
                      <span className="text-sm font-medium">
                        {Math.round(course.completionRate)}%
                      </span>
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
          title="No courses yet"
          description="You're not enrolled in any courses. Contact your coordinator to get started."
        />
      )}

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
          <CardDescription>
            Your next assignments and their due dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length > 0 ? (
            <DataTable
              columns={upcomingColumns}
              data={upcomingDeadlines}
              searchKey="title"
              searchPlaceholder="Search assignments..."
            />
          ) : (
            <EmptyState
              icon={CheckCircle}
              title="All caught up!"
              description="You don't have any upcoming deadlines."
            />
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest submissions and grades</CardDescription>
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
              title="No recent activity"
              description="Your recent submissions and grades will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
