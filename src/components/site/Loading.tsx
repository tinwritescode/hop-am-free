// Page-transition loading states, shown by the routes' loading.tsx while a page streams in.
// Skeletons are built from Bone and TextBone, laid out like the page they stand in for, inside PageLoading.
import { MamLoader } from "./MamLoader";
import { CARD } from "./PageHeading";

/** A placeholder box. Size it with Tailwind classes, e.g. `h-11 w-full`. */
export function Bone({ className, pill = false }: { className: string; pill?: boolean }) {
  return <span aria-hidden="true" className={`skeleton block ${pill ? "rounded-full" : "rounded-md"} ${className}`} />;
}

/**
 * A placeholder for one line of text. Put it inside an element with the real text's size classes:
 * the line then keeps its real height. Give it a width.
 */
export function TextBone({ className }: { className: string }) {
  return <span aria-hidden="true" className={`skeleton inline-block h-[0.8em] rounded-md align-middle ${className}`} />;
}

/**
 * The loading region: the page skeleton with Mầm walking its lantern over it and saying `label`.
 * It fades in after a short delay (`.loading-in`), so quick navigations never flash it.
 */
export function PageLoading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" className="loading-in relative">
      <div aria-hidden="true">{children}</div>
      <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-4">
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-line bg-surface px-6 pt-4 pb-3 shadow-[0_8px_28px_var(--glow)]">
          <MamLoader size={72} />
          <p className="text-sm font-semibold text-soft">{label}</p>
        </div>
      </div>
    </div>
  );
}

const WIDTH = { narrow: "max-w-[760px]", wide: "max-w-[960px]" } as const;

/** Skeleton for the pages built from PageHeading and a CARD (agent docs, CLI, admin). */
export function PageSkeleton({ width }: { width: keyof typeof WIDTH }) {
  return (
    <PageLoading label="Mầm đang mở trang…">
      <div className={`mx-auto ${WIDTH[width]}`}>
        <div className="pt-6 pb-5">
          <p className="font-serif text-[32px] leading-tight">
            <TextBone className="w-64" />
          </p>
          <p className="mt-2 max-w-[620px] text-[15px]">
            <TextBone className="w-full" />
            <TextBone className="w-2/3" />
          </p>
        </div>
        <div className={`${CARD} flex flex-col gap-3`}>
          <Bone className="h-6 w-1/3" />
          {["w-full", "w-11/12", "w-4/5", "w-full", "w-3/5"].map((w, i) => (
            <Bone key={i} className={`h-4 ${w}`} />
          ))}
          <Bone className="mt-2 h-11 w-32" />
        </div>
      </div>
    </PageLoading>
  );
}
