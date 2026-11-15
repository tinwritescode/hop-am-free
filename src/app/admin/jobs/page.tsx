import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/db/auth";
import { allJobs, QUEUES } from "@/jobs/boss";
import { CARD, PageHeading } from "@/components/site/PageHeading";
import { Mascot } from "@/components/Mascot";
import { AutoRefresh } from "./AutoRefresh";
import { JobsBoard, type Notice } from "./JobsBoard";

export const metadata: Metadata = { title: "Hàng đợi" };

type Props = { searchParams: Promise<Notice> };

export default async function JobsPage({ searchParams }: Props) {
  const user = await currentUser();
  if (!user) redirect(`/sign-in?returnTo=${encodeURIComponent("/admin/jobs")}`);
  if (!user.isAdmin)
    return (
      <main className="mx-auto max-w-[860px]">
        <PageHeading title="Hàng đợi" />
        <div className={`${CARD} flex items-center gap-3 text-sm text-soft`}>
          <Mascot size={52} />
          Chỉ admin mới xem được hàng đợi. Tài khoản {user.email} chưa có quyền này.
        </div>
      </main>
    );

  const [imports, rhythms] = await Promise.all([allJobs(QUEUES.importSong), allJobs(QUEUES.songRhythms)]);
  const active = [...imports, ...rhythms].some((j) => j.state === "created" || j.state === "retry" || j.state === "active");

  return (
    <main>
      <AutoRefresh active={active} />
      <PageHeading title="Hàng đợi">Dán nhiều link, Mầm cào và đăng từng bài ở nền. Link trùng được bỏ qua, lỗi mạng hay AI được tự thử lại 3 lần.</PageHeading>
      <JobsBoard imports={imports} rhythms={rhythms} notice={await searchParams} />
    </main>
  );
}
