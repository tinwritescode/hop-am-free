import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/db/auth";
import { listCliTokens, pendingCliLogin } from "@/db/cli";
import { normalizeUserCode } from "@/lib/cli-auth";
import { CARD as card, PageHeading } from "@/components/site/PageHeading";
import { Mascot } from "@/components/Mascot";
import { approveAction, revokeAction } from "./actions";

export const metadata: Metadata = { title: "Đăng nhập CLI" };

type Props = { searchParams: Promise<{ code?: string; status?: string }> };

const button = "fx min-h-11 rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-on-accent";

export default async function CliPage({ searchParams }: Props) {
  const { code, status } = await searchParams;
  const userCode = code ? normalizeUserCode(code) : null;
  const user = await currentUser();
  if (!user) redirect(`/sign-in?returnTo=${encodeURIComponent(userCode ? `/cli?code=${userCode}` : "/cli")}`);

  const [pending, tokens] = user.isAdmin
    ? await Promise.all([userCode ? pendingCliLogin(userCode) : null, listCliTokens(user.id)])
    : [null, []];

  return (
    <main className="mx-auto flex max-w-[760px] flex-col gap-6">
      <PageHeading title="Đăng nhập CLI">
        Cho phép công cụ dòng lệnh <code>hopamfree</code> thay ngài import và đăng bài. Chỉ duyệt mã đang hiện trong terminal của ngài.
      </PageHeading>
        {!user.isAdmin ? (
          <div className={card}>
            <div className="flex items-center gap-3 rounded-lg bg-hover p-4 text-sm text-soft">
              <Mascot size={52} />
              CLI chỉ dành cho admin. Tài khoản {user.email} chưa có quyền này.
            </div>
          </div>
        ) : (
          <>
            <div className={card}>
              {status === "approved" ? (
                <p className="font-semibold text-ok">Đã cho phép. Quay lại terminal, CLI sẽ tự đăng nhập trong vài giây.</p>
              ) : pending ? (
                <form action={approveAction} className="flex flex-col gap-4">
                  <input type="hidden" name="code" value={pending.userCode} />
                  <p className="text-soft">
                    <b>{pending.clientName}</b> xin quyền admin của <b>{user.email}</b>. Mã:
                  </p>
                  <p className="font-mono text-3xl font-bold tracking-[0.2em] text-ink">{pending.userCode}</p>
                  <button className={`${button} self-start`}>Cho phép</button>
                </form>
              ) : (
                <form className="flex flex-col gap-3">
                  {(status === "invalid" || code) && (
                    <p className="text-sm font-semibold text-warn">Mã không đúng, đã hết hạn hoặc đã được dùng.</p>
                  )}
                  <label className="text-sm font-bold text-soft" htmlFor="code">Mã trong terminal</label>
                  <div className="flex gap-2">
                    <input id="code" name="code" placeholder="ABCD-EFGH" autoComplete="off" className="h-11 w-48 rounded-md border border-line-strong bg-surface px-4 font-mono text-ink uppercase" />
                    <button className={button}>Tiếp</button>
                  </div>
                </form>
              )}
            </div>
            <div className={card}>
              <h2 className="font-serif text-2xl font-normal text-ink">Token đang dùng</h2>
              {tokens.length === 0 ? (
                <p className="mt-2 text-sm text-soft">Chưa có token nào.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {tokens.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span>
                        <b>{t.name}</b>
                        <span className="block text-soft">
                          Tạo {t.createdAt.toLocaleString("vi-VN")}
                          {t.lastUsedAt && ` · dùng lần cuối ${t.lastUsedAt.toLocaleString("vi-VN")}`}
                        </span>
                      </span>
                      <form action={revokeAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button className="min-h-11 rounded-md border border-warn px-4 py-1.5 font-bold text-warn hover:bg-warn-bg">Thu hồi</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
    </main>
  );
}
