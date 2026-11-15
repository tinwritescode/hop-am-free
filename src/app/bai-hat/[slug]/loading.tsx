import { Bone, PageLoading, TextBone } from "@/components/site/Loading";

// Lyric widths per section; chord marks sit above each line, as in the default "Trên chữ" layout.
const SECTIONS = [
  ["w-4/5", "w-2/3", "w-3/4", "w-1/2"],
  ["w-3/4", "w-4/5", "w-3/5", "w-2/3"],
] as const;

export default function SongLoading() {
  return (
    <PageLoading label="Mầm đang lấy bài…">
      <div className="flex flex-col gap-2 pt-5 pb-5 lg:pt-3 lg:pb-3">
        <p className="text-sm">
          <TextBone className="w-32" />
        </p>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-baseline lg:gap-5">
          <p className="font-serif text-4xl leading-tight sm:text-[44px] lg:text-[clamp(1.625rem,0.9rem+1.1vw,2.25rem)]">
            <TextBone className="w-2/3 max-w-md lg:w-[28rem]" />
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px]">
            <TextBone className="w-36" />
            <TextBone className="w-28" />
            <Bone className="h-[26px] w-20" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-7 lg:flex-nowrap lg:gap-5">
        <div className="min-w-0 flex-[999_1_560px] rounded-lg border border-line bg-surface">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-b border-line px-5 py-3">
            <Bone pill className="h-11 w-60" />
            <Bone pill className="h-11 w-36" />
            <Bone pill className="ml-auto h-[38px] w-72 max-w-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
            <Bone className="h-4 w-20" />
            <Bone pill className="h-9 w-24" />
            <Bone pill className="h-9 w-28" />
          </div>
          <div className="px-5 pt-2 pb-10 sm:px-8 lg:px-6 lg:pb-6 lg:[column-gap:2.25em] lg:[column-width:18em]">
            {SECTIONS.map((lines, si) => (
              <div key={si} className="break-inside-avoid pt-7 lg:pt-4">
                <p className="mb-2.5 text-[17px]">
                  <TextBone className="w-24" />
                </p>
                {lines.map((w, li) => (
                  <div key={li} className="py-[3px]">
                    <div className="flex h-[25px] items-center gap-10">
                      <Bone pill className="h-4 w-8" />
                      <Bone pill className="h-4 w-8" />
                    </div>
                    <p className="text-[18px] leading-normal">
                      <TextBone className={w} />
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden w-[280px] shrink-0 flex-col gap-4 lg:flex 2xl:w-[320px]">
          <Bone className="h-[88px] w-full" />
          <Bone className="h-[300px] w-full" />
          <Bone className="h-[240px] w-full" />
        </div>
      </div>
    </PageLoading>
  );
}
