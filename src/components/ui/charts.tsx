"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface ChartContainerProps {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactElement;
}

export function ChartContainer({ title, description, className, children }: ChartContainerProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ProgressChartProps {
  data: Array<{
    name: string;
    completion: number;
    target?: number;
  }>;
  title?: string;
  description?: string;
  className?: string;
}

export function ProgressChart({ data, title, description, className }: ProgressChartProps) {
  return (
    <ChartContainer title={title} description={description} className={className}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [`${value}%`, name === 'completion' ? 'Completion' : 'Target']}
          labelFormatter={(label) => `Course: ${label}`}
        />
        <Bar dataKey="completion" fill="#0088FE" name="Completion Rate" />
        {data.some(d => d.target) && (
          <Bar dataKey="target" fill="#00C49F" name="Target" opacity={0.5} />
        )}
      </BarChart>
    </ChartContainer>
  );
}

interface TrendChartProps {
  data: Array<{
    date: string;
    value: number;
    target?: number;
  }>;
  title?: string;
  description?: string;
  className?: string;
  dataKey?: string;
  color?: string;
}

export function TrendChart({ 
  data, 
  title, 
  description, 
  className, 
  dataKey = "value",
  color = "#0088FE"
}: TrendChartProps) {
  return (
    <ChartContainer title={title} description={description} className={className}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={2}
          dot={{ fill: color }}
        />
        {data.some(d => d.target) && (
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="#00C49F" 
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}

interface AreaChartProps {
  data: Array<{
    date: string;
    [key: string]: string | number;
  }>;
  dataKeys: Array<{
    key: string;
    color: string;
    name: string;
  }>;
  title?: string;
  description?: string;
  className?: string;
}

export function AreaChartComponent({ 
  data, 
  dataKeys,
  title, 
  description, 
  className 
}: AreaChartProps) {
  return (
    <ChartContainer title={title} description={description} className={className}>
      <AreaChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((item, index) => (
          <Area
            key={item.key}
            type="monotone"
            dataKey={item.key}
            stackId="1"
            stroke={item.color}
            fill={item.color}
            name={item.name}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
  description?: string;
  className?: string;
  showLegend?: boolean;
}

export function PieChartComponent({ 
  data, 
  title, 
  description, 
  className,
  showLegend = true 
}: PieChartProps) {
  return (
    <ChartContainer title={title} description={description} className={className}>
      <PieChart>
        <Pie
          dataKey="value"
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}`, 'Count']} />
        {showLegend && <Legend />}
      </PieChart>
    </ChartContainer>
  );
}

interface GradeDistributionChartProps {
  data: Array<{
    range: string;
    count: number;
  }>;
  title?: string;
  description?: string;
  className?: string;
}

export function GradeDistributionChart({ 
  data, 
  title = "Grade Distribution", 
  description,
  className 
}: GradeDistributionChartProps) {
  return (
    <ChartContainer title={title} description={description} className={className}>
      <BarChart data={data}>
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value}`, 'Students']} />
        <Bar dataKey="count" fill="#0088FE" />
      </BarChart>
    </ChartContainer>
  );
}

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function Sparkline({ 
  data, 
  color = "#0088FE", 
  height = 50, 
  className 
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
