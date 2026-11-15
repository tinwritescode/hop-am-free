import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Be_Vietnam_Pro, JetBrains_Mono, Yeseva_One } from "next/font/google";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { LookProvider } from "@/components/look/LookProvider";
import { GlowLayer } from "@/components/site/GlowLayer";
import { SceneStrip } from "@/components/site/SceneStrip";
import { SiteMain } from "@/components/site/SiteMain";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TelegramBridge } from "@/components/telegram/TelegramBridge";
import { parsePrefs, PREF_COOKIE } from "@/lib/prefs";
import { HOME_DESCRIPTION, HOME_TITLE, shareCards, SITE_NAME, SITE_OG_PATH } from "@/lib/seo";
import { siteOrigin } from "@/lib/site";
import { DEFAULT_SKIN_ID, isSkinId, SKINS } from "@/themes";
import { skinCss } from "@/themes/css";
import "./globals.css";

const body = Be_Vietnam_Pro({ variable: "--font-body", subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700", "800"] });
const display = Yeseva_One({ variable: "--font-display", subsets: ["latin", "vietnamese"], weight: "400" });
const code = JetBrains_Mono({ variable: "--font-code", subsets: ["latin", "vietnamese"], weight: ["500", "700"] });

const SKIN_CSS = skinCss(SKINS);

// Defaults for every page; public pages replace them with pageMeta() (canonical link, own title and image).
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin() ?? "http://localhost:3000"),
  title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
  description: HOME_DESCRIPTION,
  ...shareCards({ image: SITE_OG_PATH }),
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jar = await cookies();
  const prefs = parsePrefs({
    raw: { mode: jar.get(PREF_COOKIE.mode)?.value, skin: jar.get(PREF_COOKIE.skin)?.value, glow: jar.get(PREF_COOKIE.glow)?.value, sound: jar.get(PREF_COOKIE.sound)?.value },
    isSkin: isSkinId,
    defaultSkin: DEFAULT_SKIN_ID,
  });

  return (
    <html lang="vi" data-skin={prefs.skin} data-mode={prefs.mode} data-glow={prefs.glow ? "on" : "off"}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: SKIN_CSS }} />
      </head>
      <body className={`${body.variable} ${display.variable} ${code.variable} font-sans antialiased`}>
        <AuthKitProvider>
          <LookProvider initial={prefs}>
            <TelegramBridge>
              <GlowLayer />
              <SiteHeader />
              <SceneStrip />
              <SiteMain>
                {children}
                <SiteFooter />
              </SiteMain>
            </TelegramBridge>
          </LookProvider>
        </AuthKitProvider>
      </body>
    </html>
  );
}
