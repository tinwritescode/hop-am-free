// The /admin/jobs board, kept apart from data loading so it renders from plain job views.
import Link from "next/link";
import type { JobView } from "@/jobs/boss";
import { countStatuses, JOB_STATUSES, MAX_BATCH, type JobStatus } from "@/lib/jobs";
import { CARD } from "@/components/site/PageHeading";
import { cancelJobAction, importBatchAction, retryBatchAction, retryJobAction } from "./actions";

export type Notice = { queued?: string; skipped?: string; invalid?: string; note?: string };

const STATUS: Record<JobStatus, { label: string; cell: string; text: string }> = {
  running: { label: "Đang chạy", cell: "bg-link motion-safe:animate-pulse", text: "text-link" },
  retrying: { label: "Chờ thử lại", cell: "bg-warn-bg ring-1 ring-inset ring-warn", text: "text-warn" },
  waiting: { label: "Chờ", cell: "ring-1 ring-inset ring-line-strong", text: "text-soft" },
  failed: { label: "Lỗi", cell: "bg-warn", text: "text-warn" },
  review: { label: "Cần xem lại", cell: "bg-accent", text: "text-ink" },
  published: { label: "Đã đăng", cell: "bg-ok", text: "text-ok" },
  duplicate: { label: "Đã có sẵn", cell: "bg-line-strong", text: "text-soft" },
  done: { label: "Xong", cell: "bg-ok", text: "text-ok" },
  cancelled: { label: "Đã hủy", cell: "bg-line", text: "text-soft" },
};

const PENDING: JobStatus[] = ["running", "retrying", "waiting"];
const ATTENTION: JobStatus[] = ["failed", "review"];

const primary = "fx inline-flex min-h-10 items-center rounded-md bg-accent px-4 text-sm font-bold whitespace-nowrap text-on-accent";
const secondary = "inline-flex min-h-10 items-center rounded-md border border-line-strong px-4 text-sm font-bold whitespace-nowrap text-ink hover:bg-hover";

/** A link as host + path, so a long list of links from one site reads by the part that differs. */
function splitLink(label: string): { host: string; path: string } {
  try {
    const u = new URL(label);
    return { host: u.host.replace(/^www\./, ""), path: decodeURIComponent(u.pathname + u.search).replace(/\/$/, "") || "/" };
  } catch {
    return { host: "", path: label };
  }
}

function Swatch({ status }: { status: JobStatus }) {
  return <span aria-hidden className={`inline-block h-3 w-3 shrink-0 rounded-[3px] transition-colors duration-500 ${STATUS[status].cell}`} />;
}

/** One cell per link, coloured by what happened to it: the batch at a glance. */
function Strip({ jobs }: { jobs: JobView[] }) {
  const counts = countStatuses(jobs.map((j) => j.status));
  const summary = JOB_STATUSES.filter((s) => counts[s]).map((s) => `${counts[s]} ${STATUS[s].label.toLowerCase()}`).join(", ");
  return (
    <span role="img" aria-label={summary} className="flex flex-wrap gap-[3px]">
      {[...jobs].reverse().map((j) => (
        // Cells share the row: a short batch gets wide cells, a long one wraps onto more rows.
        <span key={j.id} title={`${STATUS[j.status].label}: ${j.label}`} className={`h-5 max-w-6 min-w-2 flex-1 rounded-[3px] transition-colors duration-500 ${STATUS[j.status].cell}`} />
      ))}
    </span>
  );
}

function Tally({ jobs }: { jobs: JobView[] }) {
  const counts = countStatuses(jobs.map((j) => j.status));
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {JOB_STATUSES.filter((s) => counts[s]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <Swatch status={s} />
          <span className="font-bold text-ink tabular-nums">{counts[s]}</span>
          <span className="text-soft">{STATUS[s].label.toLowerCase()}</span>
        </span>
      ))}
    </span>
  );
}

function Outcome({ job }: { job: JobView }) {
  const o = job.outcome;
  if (o?.kind === "published" || o?.kind === "duplicate")
    return (
      <Link href={`/bai-hat/${o.slug}`} className="text-link underline underline-offset-2">
        /bai-hat/{o.slug}
      </Link>
    );
  if (o?.kind === "review") return <span className="text-ink">{o.reason}</span>;
  if (job.error) return <span className="text-warn">{job.error}</span>;
  return null;
}

function Actions({ job }: { job: JobView }) {
  if (job.status === "review")
    return (
      <Link href={`/admin/bai-hat/moi?job=${job.id}`} className={primary}>
        Sửa nháp
      </Link>
    );
  const retry = job.status === "failed";
  if (!retry && job.status !== "waiting" && job.status !== "retrying") return null;
  return (
    <form action={retry ? retryJobAction : cancelJobAction}>
      <input type="hidden" name="queue" value={job.queue} />
      <input type="hidden" name="id" value={job.id} />
      <button className={retry ? primary : secondary}>{retry ? "Thử lại" : "Hủy"}</button>
    </form>
  );
}

function JobRow({ job }: { job: JobView }) {
  const { host, path } = splitLink(job.label);
  // A job waiting to retry has not started its next attempt yet.
  const attempts = job.status === "retrying" ? job.retryCount : job.retryCount + 1;
  return (
    <li className="flex items-start gap-x-3 gap-y-2 py-4 max-sm:flex-wrap">
      <span className={`inline-flex shrink-0 items-center gap-2 text-sm font-bold transition-colors duration-500 max-sm:w-full sm:w-32 ${STATUS[job.status].text}`}>
        <Swatch status={job.status} />
        {STATUS[job.status].label}
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block truncate text-[15px] text-ink" title={job.label}>
          {host && <span className="text-soft">{host}</span>}
          {path}
        </span>
        <span className="mt-1 block [overflow-wrap:anywhere]">
          <Outcome job={job} />
          {attempts > 1 && <span className="text-soft"> (thử {attempts} lần)</span>}
        </span>
      </span>
      <span className="shrink-0 self-center">
        <Actions job={job} />
      </span>
    </li>
  );
}

function NoticeLine({ notice }: { notice: Notice }) {
  if (notice.note === "empty") return <p className="text-sm font-semibold text-warn">Không có link http(s) hợp lệ nào.</p>;
  if (notice.note === "too-many") return <p className="text-sm font-semibold text-warn">Tối đa {MAX_BATCH} link mỗi lần.</p>;
  if (!notice.queued) return null;
  const extra = [Number(notice.skipped) > 0 && `${notice.skipped} link đang chạy sẵn nên bỏ qua`, Number(notice.invalid) > 0 && `${notice.invalid} dòng không phải link`].filter(Boolean);
  return (
    <p className="text-sm font-semibold text-ok">
      Đã xếp {notice.queued} link vào hàng đợi{extra.length > 0 && `; ${extra.join(", ")}`}.
    </p>
  );
}

function ImportForm({ open, notice }: { open: boolean; notice: Notice }) {
  return (
    <details open={open} className={`${CARD} slide-open group`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-serif text-xl text-ink">
        Nhập nhiều link
        <span aria-hidden className="text-base text-soft transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <form action={importBatchAction} className="mt-4 flex flex-col gap-3">
        <label htmlFor="urls" className="text-sm text-soft">
          Mỗi dòng một link. Dòng trống và dòng bắt đầu bằng # được bỏ qua; link đang chạy sẵn không bị xếp lại.
        </label>
        <textarea id="urls" name="urls" rows={5} placeholder={"https://hopamchuan.com/song/…\nhttps://hopamchuan.com/song/…"} className="w-full rounded-md border border-line-strong bg-surface p-3 text-sm text-ink focus:border-link" />
        <NoticeLine notice={notice} />
        <button className={`${primary} self-start`}>Xếp vào hàng đợi</button>
      </form>
    </details>
  );
}

function Batch({ jobs }: { jobs: JobView[] }) {
  const first = jobs.at(-1);
  if (!first) return null;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const open = jobs.some((j) => PENDING.includes(j.status) || ATTENTION.includes(j.status));
  return (
    <details open={open} className="slide-open group border-t border-line py-5 first:border-t-0">
      <summary className="flex cursor-pointer list-none flex-col gap-3">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-serif text-lg text-ink">
            {first.createdOn.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
            <span className="ml-2 font-sans text-sm text-soft">{jobs.length} link</span>
          </span>
          <span aria-hidden className="text-soft transition-transform group-open:rotate-180">⌄</span>
        </span>
        <Strip jobs={jobs} />
        <Tally jobs={jobs} />
      </summary>
      {failed > 0 && first.batchId && (
        <form action={retryBatchAction} className="mt-4">
          <input type="hidden" name="batchId" value={first.batchId} />
          <button className={secondary}>Thử lại {failed} link lỗi</button>
        </form>
      )}
      <ul className="mt-2 divide-y divide-line">
        {jobs.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </ul>
    </details>
  );
}

function Rhythms({ jobs }: { jobs: JobView[] }) {
  if (!jobs.length) return null;
  const counts = countStatuses(jobs.map((j) => j.status));
  const running = jobs.filter((j) => j.status === "running");
  return (
    <section className={CARD}>
      <h2 className="font-serif text-xl text-ink">Gợi ý điệu</h2>
      <p className="mt-1 text-sm text-soft">Mỗi bài mới đăng được Mầm chọn điệu đệm ở nền, từng bài một theo thứ tự.</p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-hover" role="img" aria-label={`${counts.done} xong trên ${jobs.length}`}>
        {(["done", "running", "retrying", "failed", "cancelled"] as const).map((s) =>
          counts[s] ? <span key={s} className={`transition-[width,background-color] duration-700 ${STATUS[s].cell}`} style={{ width: `${(counts[s] / jobs.length) * 100}%` }} /> : null,
        )}
      </div>
      <div className="mt-3">
        <Tally jobs={jobs} />
      </div>
      {running.length > 0 && (
        <p className="mt-3 text-sm text-soft">
          Đang chọn điệu cho: <span className="text-ink">{running.map((j) => j.label).join(", ")}</span>
        </p>
      )}
    </section>
  );
}

export function JobsBoard({ imports, rhythms, notice }: { imports: JobView[]; rhythms: JobView[]; notice: Notice }) {
  const batches = new Map<string, JobView[]>();
  for (const job of imports) {
    const key = job.batchId ?? job.id;
    batches.set(key, [...(batches.get(key) ?? []), job]);
  }
  const attention = [...imports, ...rhythms].filter((j) => ATTENTION.includes(j.status));
  const live = [...imports, ...rhythms].some((j) => PENDING.includes(j.status));

  return (
    <div className="flex flex-col gap-6">
      {live && (
        <p className="-mt-3 flex items-center gap-2 text-sm text-soft" aria-live="polite">
          <span aria-hidden className="h-2 w-2 rounded-full bg-link motion-safe:animate-pulse" />
          Đang có việc chạy, trang tự cập nhật mỗi 4 giây.
        </p>
      )}

      <section className={CARD}>
        <h2 className="font-serif text-xl text-ink">Cần xử lý</h2>
        {attention.length === 0 ? (
          <p className="mt-2 text-sm text-soft">Không có link nào lỗi hay cần xem lại.</p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {attention.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
        )}
      </section>

      <ImportForm open={batches.size === 0 || Boolean(notice.note || notice.queued)} notice={notice} />

      {batches.size > 0 && (
        <section className={CARD}>
          <h2 className="font-serif text-xl text-ink">Các đợt nhập</h2>
          <p className="mt-1 text-sm text-soft">Mỗi ô là một link. Đợt đã xong hết được thu gọn.</p>
          <div className="mt-2">
            {[...batches.entries()].map(([key, jobs]) => (
              <Batch key={key} jobs={jobs} />
            ))}
          </div>
        </section>
      )}

      <Rhythms jobs={rhythms} />
    </div>
  );
}
