/** Card surface used by the inner pages. */
export const CARD = "rounded-lg border border-line bg-surface p-5 sm:p-8";

/** Title block for pages without a bespoke design (import, CLI, agent docs). */
export function PageHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="pt-6 pb-5">
      <h1 className="font-serif text-[32px] leading-tight font-normal">{title}</h1>
      {children && <p className="mt-2 max-w-[620px] text-[15px] text-soft">{children}</p>}
    </div>
  );
}
