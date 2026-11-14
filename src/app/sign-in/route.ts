import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { safeReturnTo } from "@/lib/cli-auth";

export async function GET(req: Request) {
  const returnTo = safeReturnTo(new URL(req.url).searchParams.get("returnTo"));
  return redirect(await getSignInUrl(returnTo ? { returnTo } : undefined));
}
