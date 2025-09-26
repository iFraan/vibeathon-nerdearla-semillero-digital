"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  progress?: {
    value: number;
    max?: number;
  };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  progress,
  variant = "default",
  className
}: StatCardProps) {
  const variantStyles = {
    default: "border-border bg-card",
    success: "border-secondary bg-secondary/10",
    warning: "border-accent bg-accent/10", 
    danger: "border-destructive bg-destructive/10"
  };

  const trendStyles = {
    up: "text-secondary-foreground bg-secondary/20",
    down: "text-destructive-foreground bg-destructive/20",
    neutral: "text-muted-foreground bg-muted/20"
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
              <Badge 
                variant="secondary" 
                className={cn("text-xs", trendStyles[trend.direction])}
              >
                {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} 
                {Math.abs(trend.value)}% {trend.label}
              </Badge>
            )}
          </div>
          
          {progress && (
            <div className="space-y-1">
              <Progress 
                value={(progress.value / (progress.max || 100)) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {progress.value} of {progress.max || 100}
              </p>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
