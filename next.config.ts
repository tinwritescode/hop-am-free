import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Put <title> and og:* tags in <head> for every client, not only the bots Next knows: link previews from
  // Messenger (Facebot, meta-externalfetcher, the app itself) read only the head and showed no thumbnail.
  htmlLimitedBots: /.*/,
  // Loaded by Node at runtime instead of bundled; pnpm does not hoist its `pg` dependency for the bundler.
  serverExternalPackages: ["pg-boss"],
};

export default nextConfig;
