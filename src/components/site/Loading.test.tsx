import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomeLoading from "@/app/(home)/loading";
import AdminLoading from "@/app/admin/loading";
import AgentsLoading from "@/app/agents/loading";
import SongListLoading from "@/app/bai-hat/(list)/loading";
import SongLoading from "@/app/bai-hat/[slug]/loading";
import ArtistsLoading from "@/app/ca-si/loading";
import CliLoading from "@/app/cli/loading";
import { LookProvider } from "@/components/look/LookProvider";
import { SKINS, type SkinId } from "@/themes";

function render({ Loading, skin = "hoian" }: { Loading: () => React.ReactNode; skin?: SkinId }) {
  return load(
    renderToStaticMarkup(
      <LookProvider initial={{ mode: "night", modeSaved: true, skin, glow: false, sound: true }}>
        <Loading />
      </LookProvider>,
    ),
  );
}

describe.each([
  { route: "/", Loading: HomeLoading, label: "Mầm đang tìm bài…" },
  { route: "/bai-hat", Loading: SongListLoading, label: "Mầm đang lọc bài…" },
  { route: "/bai-hat/[slug]", Loading: SongLoading, label: "Mầm đang lấy bài…" },
  { route: "/ca-si", Loading: ArtistsLoading, label: "Mầm đang mở trang…" },
  { route: "/agents", Loading: AgentsLoading, label: "Mầm đang mở trang…" },
  { route: "/cli", Loading: CliLoading, label: "Mầm đang mở trang…" },
  { route: "/admin", Loading: AdminLoading, label: "Mầm đang mở trang…" },
])("loading state for $route", ({ Loading, label }) => {
  const $ = render({ Loading });
  const status = $('[role="status"]');

  it("is one status region that screen readers announce as Mầm's line, and nothing else", () => {
    expect(status).toHaveLength(1);
    expect(status.text()).toBe(label);
  });

  it("starts hidden behind the anti-flash delay", () => {
    expect(status.hasClass("loading-in")).toBe(true);
  });

  it("hides every skeleton block from assistive tech", () => {
    const bones = status.find(".skeleton");
    expect(bones.length).toBeGreaterThan(5);
    bones.each((_, el) => expect($(el).closest('[aria-hidden="true"]')).toHaveLength(1));
  });

  it("shows Mầm in the busy pose", () => {
    const mascot = status.find("svg");
    expect(mascot).toHaveLength(1);
    expect(mascot.hasClass("anim-trot")).toBe(true);
    expect(mascot.find(".anim-swing")).toHaveLength(1);
    expect(mascot.find(".anim-step")).toHaveLength(2);
  });

  it.each(SKINS)("dresses Mầm in the $name hat", ({ id, Hat }) => {
    const mascot = render({ Loading, skin: id })('[role="status"] svg');
    expect(mascot.html()).toContain(renderToStaticMarkup(<Hat />));
  });
});
