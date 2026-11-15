import { MODES } from "@/lib/prefs";
import { BASE_TOKENS, type ModeTokens, type Skin } from "./types";

// Token values are our own constants, but they land inside a <style> tag: refuse anything that could end a rule or the tag.
function value(v: string): string {
  if (/[<>{};]/.test(v)) throw new Error(`unsafe token value: ${v}`);
  return v;
}

function declarations(t: ModeTokens): string {
  const base = BASE_TOKENS.map((name) => `--${name}:${value(t.base[name])}`);
  const scene = Object.entries(t.scene).map(([name, v]) => `--${name}:${value(v)}`);
  return [`color-scheme:${t.colorScheme}`, ...base, ...scene].join(";");
}

/** The stylesheet that turns `<html data-skin data-mode>` into CSS custom properties. */
export function skinCss(skins: readonly Pick<Skin, "id" | "tokens">[]): string {
  return skins
    .flatMap(({ id, tokens }) => {
      const root = `:root[data-skin="${value(id)}"]`;
      return [`${root}{--cursor:${value(tokens.cursor)}}`, ...MODES.map((m) => `${root}[data-mode="${m}"]{${declarations(tokens[m])}}`)];
    })
    .join("\n");
}
