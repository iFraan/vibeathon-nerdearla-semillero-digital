import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {Icon && (
          <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        )}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingState({ title, description, className }: LoadingStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  description = "There was an error loading this content.", 
  action, 
  className 
}: ErrorStateProps) {
  return (
    <Card className={cn("border-red-200", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-xl">⚠</span>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-red-900">{title}</h3>
        <p className="text-sm text-red-600 mb-6 max-w-sm">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
