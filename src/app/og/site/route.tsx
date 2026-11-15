import { SiteShareCard } from "@/components/og/ShareCards";
import { ogImage } from "@/lib/og-image";

// Drawn once at build time.
export const dynamic = "force-static";

export async function GET() {
  return ogImage({ element: <SiteShareCard />, cache: "daily" });
}
