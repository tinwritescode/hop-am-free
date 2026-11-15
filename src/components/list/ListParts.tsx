// Server-rendered pieces of /bai-hat. Every control is a plain link to another list URL, so filters, sorting and
// paging work before (and without) JavaScript, and the back button steps through them.
import Link from "next/link";
import { SORTS, type Tally } from "@/lib/catalog";
import { clearedHref, FACET_TOP, hrefWith, pageItems, type ListQuery } from "@/lib/song-list";
import { CHIP, chipTone } from "@/components/home/chip";

export function SortTabs({ query }: { query: ListQuery }) {
  return (
    <nav aria-label="Sắp xếp" className="mt-2.5 flex gap-1 overflow-x-auto border-b border-line">
      {SORTS.map((s) => {
        const on = query.sort === s.id;
        return (
          <Link
            key={s.id}
            href={hrefWith(query, { sort: s.id })}
            aria-current={on ? "page" : undefined}
            className={`-mb-px flex h-11 shrink-0 items-center border-b-2 px-3 text-sm no-underline ${on ? "border-accent font-bold text-ink" : "border-transparent font-medium text-soft hover:text-ink"}`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}

type FacetProps = {
  id: string;
  title: string;
  items: Tally[];
  selected: string | null;
  /** Link that selects `name`, or clears the facet when `name` is null. */
  hrefFor: (name: string | null) => string;
  look: "rows" | "chips";
};

/** One filter group: the FACET_TOP most common values (plus the selected one), the rest behind "Xem thêm". */
export function FacetList({ id, title, items, selected, hrefFor, look }: FacetProps) {
  if (items.length === 0 && selected === null) return null;
  const top = items.slice(0, FACET_TOP);
  const rest = items.slice(FACET_TOP);
  const picked = selected !== null && !top.some((t) => t.name === selected) ? (items.find((t) => t.name === selected) ?? { name: selected, count: 0 }) : null;
  const shown = picked ? [...top, picked] : top;
  const hidden = rest.filter((t) => t.name !== selected);
  const option = (t: Tally) => <FacetOption key={t.name} item={t} on={t.name === selected} href={hrefFor(t.name === selected ? null : t.name)} look={look} />;
  const wrap = look === "chips" ? "flex flex-wrap gap-1.5" : "flex flex-col";
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex scroll-mt-4 flex-col gap-2">
      <h2 id={`${id}-h`} className="font-bold">
        {title}
      </h2>
      <div className={wrap}>{shown.map(option)}</div>
      {hidden.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 w-fit items-center font-semibold text-link">
            <span className="group-open:hidden">Xem thêm {hidden.length}</span>
            <span className="hidden group-open:inline">Thu gọn</span>
          </summary>
          <div className={wrap}>{hidden.map(option)}</div>
        </details>
      )}
    </section>
  );
}

function FacetOption({ item, on, href, look }: { item: Tally; on: boolean; href: string; look: FacetProps["look"] }) {
  const label = on ? `${item.name}, đang lọc, bấm để bỏ` : undefined;
  if (look === "chips")
    return (
      <Link href={href} aria-current={on ? "true" : undefined} aria-label={label} title={`${item.count} bài`} className={`${CHIP} ${chipTone(on)} inline-flex items-center no-underline`}>
        {item.name}
      </Link>
    );
  return (
    <Link
      href={href}
      aria-current={on ? "true" : undefined}
      aria-label={label}
      className={`-mx-2.5 flex min-h-11 items-center justify-between gap-3 rounded-md px-2.5 text-ink no-underline ${on ? "bg-hover font-bold" : "hover:bg-hover"}`}
    >
      <span className="min-w-0">
        {item.name}
        {on && <span aria-hidden="true"> ✕</span>}
      </span>
      <span className="text-soft">{item.count}</span>
    </Link>
  );
}

/** The filters in effect, each with a link that removes it, and one that removes them all. */
export function ActiveFilters({ query }: { query: ListQuery }) {
  const active = [
    query.q && { label: `Tìm “${query.q}”`, href: hrefWith(query, { q: "" }) },
    query.artist && { label: `Ca sĩ ${query.artist}`, href: hrefWith(query, { artist: null }) },
    query.rhythm && { label: `Điệu ${query.rhythm}`, href: hrefWith(query, { rhythm: null }) },
    query.key && { label: `Tone ${query.key}`, href: hrefWith(query, { key: null }) },
    query.known.length > 0 && { label: `Chơi được với ${query.known.join(" ")}`, href: hrefWith(query, { known: [] }) },
  ].filter((f) => typeof f === "object" && f !== null);
  if (active.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
      {active.map((f) => (
        <Link key={f.label} href={f.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 font-semibold text-ink no-underline hover:bg-hover">
          {f.label}
          <span aria-hidden="true">✕</span>
          <span className="sr-only">(bỏ lọc)</span>
        </Link>
      ))}
      {active.length > 1 && (
        <Link href={clearedHref(query)} className="flex min-h-11 items-center px-2 font-semibold">
          Bỏ hết
        </Link>
      )}
    </div>
  );
}

export function Pagination({ query, page, pageCount }: { query: ListQuery; page: number; pageCount: number }) {
  if (pageCount < 2) return null;
  const box = "flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm font-semibold no-underline";
  return (
    <nav aria-label="Phân trang" className="mt-5 flex flex-wrap items-center gap-1">
      {page > 1 && (
        <Link href={hrefWith(query, { page: page - 1 })} rel="prev" className={`${box} border border-line-strong bg-surface text-ink`}>
          ← Trước
        </Link>
      )}
      {pageItems({ page, pageCount }).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-soft">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefWith(query, { page: p })}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Trang ${p}`}
            className={`${box} ${p === page ? "bg-accent text-on-accent" : "text-ink hover:bg-hover"}`}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link href={hrefWith(query, { page: page + 1 })} rel="next" className={`${box} border border-line-strong bg-surface text-ink`}>
          Sau →
        </Link>
      )}
    </nav>
  );
}
