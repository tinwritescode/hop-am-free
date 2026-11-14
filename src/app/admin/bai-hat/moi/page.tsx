import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/db/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { ForestFooter, SkyBand } from "@/components/Scenery";
import { Mascot } from "@/components/Mascot";
import { SongForm } from "./SongForm";

export const metadata: Metadata = { title: "Thêm bài hát" };

export default async function NewSongPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <SkyBand>
        <SiteHeader />
        <section className="mx-auto max-w-[1280px] px-4 pt-8 pb-32 sm:px-8">
          <h1 className="font-serif text-4xl font-bold text-[#16301f] sm:text-[48px]">Thêm bài hát</h1>
          <p className="mt-2 max-w-[620px] text-[16px] font-semibold text-[#2e4a3a]">
            Dán link một trang hợp âm để Mầm đọc và làm sạch, hoặc tự gõ. Lưu xong, Mầm sẽ chọn các điệu đệm hợp với bài.
          </p>
        </section>
      </SkyBand>
      <main className="relative mx-auto -mt-24 max-w-[960px] px-4 pb-16 sm:px-8">
        <div className="rounded-[26px] bg-white p-5 shadow-[0_1px_0_#dce8d8,0_12px_32px_rgba(47,107,71,0.10)] sm:p-8">
          {user.isAdmin ? (
            <SongForm />
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-moss p-4 text-sm text-ink-soft">
              <Mascot size={44} />
              Chỉ admin mới thêm được bài. Tài khoản {user.email} chưa có quyền này.
            </div>
          )}
        </div>
      </main>
      <ForestFooter />
    </>
  );
}
