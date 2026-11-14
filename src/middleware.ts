import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// Session handling only; pages stay public and opt into auth via withAuth().
export default authkitMiddleware();

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
