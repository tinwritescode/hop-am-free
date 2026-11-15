import { handleAuth } from "@workos-inc/authkit-nextjs";
import { siteOrigin } from "@/lib/site";

// Without baseURL the SDK redirects to request.url's origin, which is localhost:8080 on Railway.
export const GET = handleAuth({ baseURL: siteOrigin() });
