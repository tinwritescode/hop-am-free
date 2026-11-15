import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/db/auth";
import { CARD, PageHeading } from "@/components/site/PageHeading";
import { Mascot } from "@/components/Mascot";
import { SongForm } from "./SongForm";

export const metadata: Metadata = { title: "Thêm bài hát" };

export default async function NewSongPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto max-w-[960px]">
      <PageHeading title="Thêm bài hát">
        Dán link một trang hợp âm để Mầm đọc và làm sạch, hoặc tự gõ. Lưu xong, Mầm sẽ chọn các điệu đệm hợp với bài.
      </PageHeading>
      <div className={CARD}>
        {user.isAdmin ? (
          <SongForm />
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-hover p-4 text-sm text-soft">
            <Mascot size={52} />
            Chỉ admin mới thêm được bài. Tài khoản {user.email} chưa có quyền này.
          </div>
        )}
      </div>
    </main>
  );
}
