import Link from "next/link";
import { MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="space-y-3 md:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">Customer conversations on WhatsApp for Australian businesses, starting with health clinics.</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5 text-primary" /> Built and hosted in Australia</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Product</p>
          <Link href="/app/inbox" className="block text-muted-foreground hover:text-foreground">Live demo</Link>
          <Link href="/pricing" className="block text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="/#trust" className="block text-muted-foreground hover:text-foreground">Privacy & security</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">About this demo</p>
          <p className="text-muted-foreground">All clinics, people, numbers and figures shown are fictional. Third-party product names are used for reference only.</p>
        </div>
      </div>
      <p className="border-t py-4 text-center text-xs text-muted-foreground">© 2026 Notify (working name). Demo build.</p>
    </footer>
  );
}
