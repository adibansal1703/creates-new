import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type PostStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const statusStyles: Record<PostStatus, string> = {
  scheduled: "border-primary/40 bg-primary/10 text-primary",
  published: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  cancelled: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusStyles[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
