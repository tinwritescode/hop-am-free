import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Put <title> and og:* tags in <head> for every client, not only the bots Next knows: link previews from
  // Messenger (Facebot, meta-externalfetcher, the app itself) read only the head and showed no thumbnail.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
