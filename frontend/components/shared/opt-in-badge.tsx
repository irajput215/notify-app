import { Ban, CircleCheck, Clock } from "lucide-react";
import type { OptInStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function OptInBadge({ status }: { status: OptInStatus }) {
  if (status === "opted_in") return <Badge variant="success"><CircleCheck /> Opted in</Badge>;
  if (status === "opted_out") return <Badge variant="muted"><Ban /> Opted out</Badge>;
  return <Badge variant="warning"><Clock /> Pending</Badge>;
}
