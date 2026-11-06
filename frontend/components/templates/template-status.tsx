import { CircleCheck, CircleX, Clock, PencilLine } from "lucide-react";
import type { TemplateCategory, TemplateStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  if (status === "Approved") return <Badge variant="success"><CircleCheck /> Approved</Badge>;
  if (status === "Pending") return <Badge variant="warning"><Clock className="animate-pulse" /> Pending review</Badge>;
  if (status === "Rejected") return <Badge variant="destructive"><CircleX /> Rejected</Badge>;
  return <Badge variant="muted"><PencilLine /> Draft</Badge>;
}

export function CategoryBadge({ category }: { category: TemplateCategory }) {
  const variant = category === "Marketing" ? "violet" : category === "Authentication" ? "outline" : "info";
  return <Badge variant={variant}>{category}</Badge>;
}
