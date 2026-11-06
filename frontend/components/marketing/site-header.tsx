import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const BOOK_A_CALL = "mailto:hello@notify.example?subject=Book%20a%20call%20about%20Notify";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Notify home"><Logo /></Link>
        <nav aria-label="Site" className="hidden flex-1 items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/#how" className="hover:text-foreground">How it works</Link>
          <Link href="/#clinics" className="hover:text-foreground">For clinics</Link>
          <Link href="/#trust" className="hover:text-foreground">Privacy</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild className="hidden sm:inline-flex"><a href={BOOK_A_CALL}>Book a call</a></Button>
          <Button asChild><Link href="/app/inbox">View live demo</Link></Button>
        </div>
      </div>
    </header>
  );
}
