/**
 * The public origin (e.g. https://hopam.tyvn.online), taken from the WorkOS callback URL.
 * Behind Railway's proxy `request.url` is the internal https://localhost:8080, so never build public links from it.
 */
export function siteOrigin(): string | undefined {
  const callback = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;
  return callback ? new URL(callback).origin : undefined;
}
