// Skeleton for /bai-hat: the song list with its sort tabs, and the filters beside it.
import { SORTS } from "@/lib/catalog";
import { Bone, PageLoading, TextBone } from "@/components/site/Loading";

const ROWS = [
  ["w-1/2", "w-4/5"],
  ["w-2/5", "w-3/4"],
  ["w-3/5", "w-5/6"],
  ["w-1/3", "w-2/3"],
  ["w-1/2", "w-3/4"],
  ["w-2/5", "w-4/5"],
  ["w-3/5", "w-2/3"],
  ["w-1/3", "w-5/6"],
] as const;

export default function SongListLoading() {
  return (
    <PageLoading label="Mầm đang lọc bài…">
      <div className="flex flex-wrap items-start gap-8 pt-5">
        <div className="min-w-0 flex-[999_1_560px]">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-serif text-[26px]">
              <TextBone className="w-36" />
            </p>
            <p className="text-sm">
              <TextBone className="w-16" />
            </p>
          </div>
          <div className="mt-2.5 flex gap-1 border-b border-line">
            {SORTS.map((s) => (
              <span key={s.id} className="flex h-11 items-center px-3 text-sm">
                <TextBone className="w-16" />
              </span>
            ))}
          </div>
          {ROWS.map(([title, snippet], i) => (
            <div key={i} className="flex items-start gap-4 border-b border-line px-2 py-2.5">
              <div className="min-w-0 flex-auto">
                <p className="text-[15px]">
                  <TextBone className={title} />
                </p>
                <p className="mt-0.5 text-sm leading-normal">
                  <TextBone className={snippet} />
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end text-[13px] leading-normal">
                <span>
                  <TextBone className="w-6" />
                </span>
                <span>
                  <TextBone className="w-12" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-6 text-sm">
          <div className="flex flex-col gap-2.5">
            <p>
              <TextBone className="w-36" />
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 12 }, (_, i) => (
                <Bone key={i} className="h-11 w-11" />
              ))}
            </div>
            <span className="flex min-h-11 items-center">
              <TextBone className="w-48" />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="mb-1">
              <TextBone className="w-20" />
            </p>
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="flex h-11 items-center justify-between">
                <TextBone className="w-24" />
                <TextBone className="w-4" />
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 8 }, (_, i) => (
              <Bone key={i} className="h-11 w-11" />
            ))}
          </div>
        </div>
      </div>
    </PageLoading>
  );
}
