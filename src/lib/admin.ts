/** ADMIN_EMAILS is a comma-separated allowlist; only verified emails count, so nobody can sign up as an admin's address. */
export function isAdmin({ email, emailVerified, allowlist }: { email: string; emailVerified: boolean; allowlist: string | undefined }): boolean {
  if (!emailVerified) return false;
  const admins = (allowlist ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}
