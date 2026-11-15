import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/db/auth";
import { CARD, PageHeading } from "@/components/site/PageHeading";
import { Mascot } from "@/components/Mascot";
import { findJob, QUEUES } from "@/jobs/boss";
import { SongForm } from "./SongForm";

export const metadata: Metadata = { title: "Thêm bài hát" };

type Props = { searchParams: Promise<{ job?: string }> };

/** A draft held for review by a queued import (`?job=<id>` from /admin/jobs), if there is one. */
async function reviewDraft(job: string | undefined) {
  const id = z.uuid().safeParse(job);
  if (!id.success) return undefined;
  const found = await findJob({ queue: QUEUES.importSong, id: id.data });
  return found?.outcome?.kind === "review" ? found.outcome.draft : undefined;
}

export default async function NewSongPage({ searchParams }: Props) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const initial = user.isAdmin ? await reviewDraft((await searchParams).job) : undefined;

  return (
    <main className="mx-auto max-w-[960px]">
      <PageHeading title="Thêm bài hát">
        Dán link một trang hợp âm để Mầm đọc và làm sạch, hoặc tự gõ. Lưu xong, Mầm sẽ chọn các điệu đệm hợp với bài.
      </PageHeading>
      <div className={CARD}>
        {user.isAdmin ? (
          <SongForm initial={initial} />
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
