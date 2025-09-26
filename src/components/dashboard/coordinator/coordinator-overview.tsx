"use client";

import { StatCard } from "@/components/ui/stat-card";
import { ProgressChart, AreaChartComponent, PieChartComponent, GradeDistributionChart } from "@/components/ui/charts";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  Award,
  BarChart3,
  Download,
  Eye,
  UserCheck,
  Settings,
  FileSpreadsheet
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";

interface CoordinatorOverviewProps {
  coordinatorId: string;
  data: {
    systemMetrics: {
      totalStudents: number;
      totalTeachers: number;
      totalCourses: number;
      activeUsers: number;
      averageCompletion: number;
      averageGrade: number | null;
      studentsAtRisk: number;
    };
    courseMetrics: Array<{
      courseId: string;
      courseName: string;
      teacherName: string;
      totalStudents: number;
      activeStudents: number;
      averageCompletion: number;
      averageGrade: number | null;
      studentsAtRisk: number;
    }>;
    teacherPerformance: Array<{
      teacherId: string;
      teacherName: string;
      courses: number;
      totalStudents: number;
      averageEngagement: number;
      responseTime: number; // hours
    }>;
    riskAnalysis: Array<{
      studentId: string;
      studentName: string;
      email: string;
      courses: string[];
      overallCompletion: number;
      averageGrade: number | null;
      riskLevel: 'high' | 'medium';
      lastActivity: Date;
    }>;
    gradeDistribution: Array<{
      range: string;
      count: number;
    }>;
    engagementTrends: Array<{
      date: string;
      activeStudents: number;
      submissions: number;
      logins: number;
    }>;
  };
  loading?: boolean;
}

const courseColumns: ColumnDef<any>[] = [
  {
    accessorKey: "courseName",
    header: "Course",
    cell: ({ row }) => {
      const course = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{course.courseName}</span>
          <span className="text-sm text-muted-foreground">by {course.teacherName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalStudents",
    header: "Students",
    cell: ({ row }) => {
      const course = row.original;
      return (
        <div className="flex flex-col">
          <span>{course.totalStudents} enrolled</span>
          <span className="text-sm text-muted-foreground">
            {course.activeStudents} active ({Math.round((course.activeStudents / course.totalStudents) * 100)}%)
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "averageCompletion",
    header: "Completion",
    cell: ({ row }) => {
      const completion = row.original.averageCompletion;
      return (
        <div className="flex items-center gap-2">
          <span>{Math.round(completion)}%</span>
          <div className="w-12 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${completion >= 80 ? 'bg-green-500' : completion >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "studentsAtRisk",
    header: "At Risk",
    cell: ({ row }) => {
      const count = row.original.studentsAtRisk;
      return count > 0 ? (
        <Badge variant="destructive">{count} students</Badge>
      ) : (
        <Badge variant="default">None</Badge>
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
          View
        </Button>
        <Button size="sm" variant="outline">
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>
    ),
  },
];

const teacherColumns: ColumnDef<any>[] = [
  {
    accessorKey: "teacherName",
    header: "Teacher",
  },
  {
    accessorKey: "courses",
    header: "Courses",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.courses} courses</span>
        <span className="text-sm text-muted-foreground">
          {row.original.totalStudents} total students
        </span>
      </div>
    ),
  },
  {
    accessorKey: "averageEngagement",
    header: "Engagement",
    cell: ({ row }) => {
      const engagement = row.original.averageEngagement;
      return (
        <div className="flex items-center gap-2">
          <span>{Math.round(engagement)}%</span>
          <Badge variant={engagement >= 80 ? "default" : engagement >= 60 ? "secondary" : "destructive"}>
            {engagement >= 80 ? "High" : engagement >= 60 ? "Medium" : "Low"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "responseTime",
    header: "Response Time",
    cell: ({ row }) => {
      const hours = row.original.responseTime;
      return (
        <span className={hours <= 24 ? "text-green-600" : hours <= 48 ? "text-yellow-600" : "text-red-600"}>
          {hours}h avg
        </span>
      );
    },
  },
];

const riskStudentsColumns: ColumnDef<any>[] = [
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{student.studentName}</span>
          <span className="text-sm text-muted-foreground">{student.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "courses",
    header: "Courses",
    cell: ({ row }) => {
      const courses = row.original.courses;
      return (
        <div className="flex flex-wrap gap-1">
          {courses.slice(0, 2).map((course: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {course}
            </Badge>
          ))}
          {courses.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{courses.length - 2} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "overallCompletion",
    header: "Progress",
    cell: ({ row }) => {
      const completion = row.original.overallCompletion;
      const grade = row.original.averageGrade;
      return (
        <div className="flex flex-col">
          <span>{Math.round(completion)}% complete</span>
          {grade && (
            <span className="text-sm text-muted-foreground">
              Avg: {Math.round(grade)}%
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "lastActivity",
    header: "Last Active",
    cell: ({ row }) => {
      const lastActivity = row.original.lastActivity;
      const daysSinceActive = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <span className={daysSinceActive > 7 ? "text-red-600" : daysSinceActive > 3 ? "text-yellow-600" : "text-green-600"}>
          {formatDistanceToNow(lastActivity, { addSuffix: true })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button size="sm" variant="outline">
        Intervene
      </Button>
    ),
  },
];

export function CoordinatorOverview({ coordinatorId, data, loading }: CoordinatorOverviewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState title="Loading system analytics..." />
      </div>
    );
  }

  const { 
    systemMetrics, 
    courseMetrics, 
    teacherPerformance, 
    riskAnalysis, 
    gradeDistribution, 
    engagementTrends 
  } = data;

  // Prepare chart data
  const coursePerformanceData = courseMetrics.map(course => ({
    name: course.courseName.length > 15 ? course.courseName.substring(0, 15) + '...' : course.courseName,
    completion: Math.round(course.averageCompletion),
    students: course.totalStudents,
    active: course.activeStudents
  }));

  const engagementChartData = engagementTrends.map(trend => ({
    date: trend.date,
    "Active Students": trend.activeStudents,
    "Submissions": trend.submissions,
    "Logins": trend.logins
  }));

  const engagementDataKeys = [
    { key: "Active Students", color: "#0088FE", name: "Active Students" },
    { key: "Submissions", color: "#00C49F", name: "Submissions" },
    { key: "Logins", color: "#FFBB28", name: "Logins" }
  ];

  const riskDistribution = [
    { name: "Low Risk", value: systemMetrics.totalStudents - systemMetrics.studentsAtRisk },
    { name: "At Risk", value: systemMetrics.studentsAtRisk }
  ];

  return (
    <div className="space-y-6">
      {/* Header with export actions */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">System Overview</h1>
          <p className="text-muted-foreground">
            Complete analytics and management for Semillero Digital
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Advanced Analytics
          </Button>
        </div>
      </div>

      {/* Key System Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={systemMetrics.totalStudents}
          icon={Users}
          description={`${systemMetrics.activeUsers} currently active`}
          trend={{ value: 12, label: "vs last month", direction: "up" }}
        />
        
        <StatCard
          title="Average Progress"
          value={`${Math.round(systemMetrics.averageCompletion)}%`}
          icon={TrendingUp}
          description="System-wide completion"
          variant={systemMetrics.averageCompletion >= 75 ? "success" : systemMetrics.averageCompletion >= 60 ? "warning" : "danger"}
        />
        
        <StatCard
          title="Average Grade"
          value={systemMetrics.averageGrade ? `${Math.round(systemMetrics.averageGrade)}%` : "N/A"}
          icon={Award}
          description="Across all courses"
          variant={systemMetrics.averageGrade && systemMetrics.averageGrade >= 80 ? "success" : "warning"}
        />
        
        <StatCard
          title="Students at Risk"
          value={systemMetrics.studentsAtRisk}
          icon={AlertTriangle}
          variant={systemMetrics.studentsAtRisk === 0 ? "success" : systemMetrics.studentsAtRisk < 10 ? "warning" : "danger"}
          description={`${Math.round((systemMetrics.studentsAtRisk / systemMetrics.totalStudents) * 100)}% of total`}
        />
      </div>

      {/* Charts Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProgressChart
          data={coursePerformanceData}
          title="Course Performance"
          description="Completion rates across all courses"
        />
        
        <div className="grid gap-4 md:grid-cols-2">
          <PieChartComponent
            data={riskDistribution}
            title="Risk Distribution"
            description="Student risk levels"
            showLegend={false}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Course Completion</span>
                  <span className="text-sm font-medium">{Math.round(systemMetrics.averageCompletion)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">User Engagement</span>
                  <span className="text-sm font-medium">{Math.round((systemMetrics.activeUsers / systemMetrics.totalStudents) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Teachers Active</span>
                  <span className="text-sm font-medium">{systemMetrics.totalTeachers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Courses Running</span>
                  <span className="text-sm font-medium">{systemMetrics.totalCourses}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Engagement Trends */}
      <AreaChartComponent
        data={engagementChartData}
        dataKeys={engagementDataKeys}
        title="User Engagement Trends"
        description="Daily activity metrics over the past 30 days"
      />

      {/* Grade Distribution */}
      <GradeDistributionChart
        data={gradeDistribution}
        title="Grade Distribution"
        description="Distribution of grades across all assignments"
      />

      {/* Detailed Tables */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">
            Course Analysis ({courseMetrics.length})
          </TabsTrigger>
          <TabsTrigger value="teachers">
            Teacher Performance ({teacherPerformance.length})
          </TabsTrigger>
          <TabsTrigger value="risk">
            Students at Risk ({riskAnalysis.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Performance Analysis
              </CardTitle>
              <CardDescription>
                Detailed metrics for all active courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={courseColumns}
                data={courseMetrics}
                searchKey="courseName"
                searchPlaceholder="Search courses..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Teacher Performance
              </CardTitle>
              <CardDescription>
                Teaching effectiveness and student engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={teacherColumns}
                data={teacherPerformance}
                searchKey="teacherName"
                searchPlaceholder="Search teachers..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Students Requiring Intervention
              </CardTitle>
              <CardDescription>
                Students who may need additional support or intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {riskAnalysis.length > 0 ? (
                <DataTable
                  columns={riskStudentsColumns}
                  data={riskAnalysis}
                  searchKey="studentName"
                  searchPlaceholder="Search students..."
                />
              ) : (
                <EmptyState
                  icon={Award}
                  title="All students on track!"
                  description="No students currently flagged as needing intervention."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
