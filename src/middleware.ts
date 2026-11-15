import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { legacySearchRedirect } from "@/lib/song-list";
import { startParamRedirect } from "@/lib/telegram/start-param";

// Session handling only; pages stay public and opt into auth via withAuth().
const authkit = authkitMiddleware();

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // t.me/HopAmBot?startapp=<slug> opens the Mini App URL with ?tgWebAppStartParam=<slug>: go straight to the song.
  // The browser carries the #tgWebApp… fragment over to the redirect target (a Location without a fragment inherits it).
  const song = startParamRedirect(request.nextUrl);
  if (song) return NextResponse.redirect(song);
  // Here rather than in the page: the home page streams behind its loading.tsx, so a page redirect would arrive as a 200.
  const search = legacySearchRedirect(request.nextUrl);
  if (search) return NextResponse.redirect(search);
  return authkit(request, event);
}

export const config = {
  // Share images, sitemap and robots need no session, and a session cookie on them would stop crawlers and CDNs caching them.
  matcher: ["/((?!_next/static|_next/image|og/|sitemap\\.xml|robots\\.txt|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
