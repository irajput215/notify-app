import { AppShell } from "@/components/layout/app-shell";

export default function ProductLayout({ children }: LayoutProps<"/app">) {
  return <AppShell>{children}</AppShell>;
}
