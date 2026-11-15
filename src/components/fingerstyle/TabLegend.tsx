const MARKS = [
  { mark: "0–24", says: "Số phím cần bấm, tính từ capo. 0 là dây buông." },
  { mark: "x", says: "Chặn tiếng: đặt hờ ngón lên dây rồi gảy, ra tiếng “tạch” không có nốt." },
  { mark: "h", says: "Luyến lên: gảy nốt trước, rồi gõ mạnh ngón tay trái xuống phím sau, không gảy lại." },
  { mark: "p", says: "Luyến xuống: đang bấm nốt cao, kéo ngón tay trái ra khỏi dây để nốt thấp hơn tự kêu." },
  { mark: "/", says: "Vuốt lên: giữ ngón trên dây, trượt lên phím cao hơn." },
  { mark: "\\", says: "Vuốt xuống: giữ ngón trên dây, trượt về phím thấp hơn." },
  { mark: "o", says: "Đập cổ tay: đập nhẹ mép bàn tay phải xuống dây, như tiếng trống." },
  { mark: "|", says: "Vạch nhịp." },
] as const;

/** How to read the tab, for players meeting it for the first time. */
export function TabLegend() {
  return (
    <section aria-labelledby="doc-tab" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <h2 id="doc-tab" className="font-serif text-xl font-normal">
        Cách đọc tab
      </h2>
      <p className="mt-2 max-w-[640px] text-sm text-soft">
        Sáu dòng là sáu dây: dòng trên cùng (e) là dây 1 mảnh nhất, dòng dưới cùng (E) là dây 6 to nhất. Đọc từ trái sang phải; các số thẳng cột thì gảy cùng lúc.
      </p>
      <dl className="mt-4 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
        {MARKS.map((m) => (
          <div key={m.mark} className="flex gap-3">
            <dt className="w-12 shrink-0 font-mono font-bold text-ink">{m.mark}</dt>
            <dd className="text-soft">{m.says}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
