import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/db/auth";
import { listCliTokens, pendingCliLogin } from "@/db/cli";
import { normalizeUserCode } from "@/lib/cli-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { ForestFooter, SkyBand } from "@/components/Scenery";
import { Mascot } from "@/components/Mascot";
import { approveAction, revokeAction } from "./actions";

export const metadata: Metadata = { title: "Đăng nhập CLI" };

type Props = { searchParams: Promise<{ code?: string; status?: string }> };

const card = "rounded-[26px] bg-white p-5 shadow-[0_1px_0_#dce8d8,0_12px_32px_rgba(47,107,71,0.10)] sm:p-8";
const button = "rounded-full bg-leaf px-5 py-2.5 text-sm font-bold text-white hover:brightness-110";

export default async function CliPage({ searchParams }: Props) {
  const { code, status } = await searchParams;
  const userCode = code ? normalizeUserCode(code) : null;
  const user = await currentUser();
  if (!user) redirect(`/sign-in?returnTo=${encodeURIComponent(userCode ? `/cli?code=${userCode}` : "/cli")}`);

  const [pending, tokens] = user.isAdmin
    ? await Promise.all([userCode ? pendingCliLogin(userCode) : null, listCliTokens(user.id)])
    : [null, []];

  return (
    <>
      <SkyBand>
        <SiteHeader />
        <section className="mx-auto max-w-[1280px] px-4 pt-8 pb-32 sm:px-8">
          <h1 className="font-serif text-4xl font-bold text-[#16301f] sm:text-[48px]">Đăng nhập CLI</h1>
          <p className="mt-2 max-w-[620px] text-[16px] font-semibold text-[#2e4a3a]">
            Cho phép công cụ dòng lệnh <code>hopamfree</code> thay ngài import và đăng bài. Chỉ duyệt mã đang hiện trong terminal của ngài.
          </p>
        </section>
      </SkyBand>
      <main className="relative mx-auto -mt-24 flex max-w-[760px] flex-col gap-6 px-4 pb-16 sm:px-8">
        {!user.isAdmin ? (
          <div className={card}>
            <div className="flex items-center gap-3 rounded-2xl bg-moss p-4 text-sm text-ink-soft">
              <Mascot size={44} />
              CLI chỉ dành cho admin. Tài khoản {user.email} chưa có quyền này.
            </div>
          </div>
        ) : (
          <>
            <div className={card}>
              {status === "approved" ? (
                <p className="font-semibold text-leaf">Đã cho phép. Quay lại terminal, CLI sẽ tự đăng nhập trong vài giây.</p>
              ) : pending ? (
                <form action={approveAction} className="flex flex-col gap-4">
                  <input type="hidden" name="code" value={pending.userCode} />
                  <p className="text-ink-soft">
                    <b>{pending.clientName}</b> xin quyền admin của <b>{user.email}</b>. Mã:
                  </p>
                  <p className="font-mono text-3xl font-bold tracking-[0.2em] text-[#16301f]">{pending.userCode}</p>
                  <button className={`${button} self-start`}>Cho phép</button>
                </form>
              ) : (
                <form className="flex flex-col gap-3">
                  {(status === "invalid" || code) && (
                    <p className="text-sm font-semibold text-clay-ink">Mã không đúng, đã hết hạn hoặc đã được dùng.</p>
                  )}
                  <label className="text-sm font-bold text-ink-soft" htmlFor="code">Mã trong terminal</label>
                  <div className="flex gap-2">
                    <input id="code" name="code" placeholder="ABCD-EFGH" autoComplete="off" className="w-48 rounded-full border border-line px-4 py-2 font-mono uppercase" />
                    <button className={button}>Tiếp</button>
                  </div>
                </form>
              )}
            </div>
            <div className={card}>
              <h2 className="font-serif text-2xl font-bold text-[#16301f]">Token đang dùng</h2>
              {tokens.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">Chưa có token nào.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {tokens.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span>
                        <b>{t.name}</b>
                        <span className="block text-ink-soft">
                          Tạo {t.createdAt.toLocaleString("vi-VN")}
                          {t.lastUsedAt && ` · dùng lần cuối ${t.lastUsedAt.toLocaleString("vi-VN")}`}
                        </span>
                      </span>
                      <form action={revokeAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button className="rounded-full border border-clay-line px-4 py-1.5 font-bold text-clay-ink hover:bg-clay-bg">Thu hồi</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
      <ForestFooter />
    </>
  );
}
