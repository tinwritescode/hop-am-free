// The home page sits in the (home) group so this skeleton covers only "/": a root loading.tsx would also
// wrap every other route and show the home sections before their own skeletons.
import { ArtistCardBone } from "@/components/home/ArtistCard";
import { Bone, PageLoading, TextBone } from "@/components/site/Loading";

const ROWS = ["w-1/2", "w-2/5", "w-3/5", "w-1/3", "w-1/2", "w-2/5"] as const;

function Head() {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <p className="font-serif text-[22px]">
        <TextBone className="w-36" />
      </p>
      <p className="text-sm">
        <TextBone className="w-28" />
      </p>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <PageLoading label="Mầm đang tìm bài…">
      <div className="flex flex-col gap-10 pt-6">
        <div className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface px-6 py-[22px]">
          <Bone className="h-[54px] w-full" />
          <p className="text-sm">
            <TextBone className="w-72 max-w-full" />
          </p>
        </div>

        <div>
          <Head />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
            {Array.from({ length: 8 }, (_, i) => (
              <ArtistCardBone key={i} />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-8">
          <div className="min-w-0 flex-[999_1_540px]">
            <Head />
            {ROWS.map((w, i) => (
              <div key={i} className="flex items-start gap-4 border-b border-line px-2 py-2.5">
                <div className="min-w-0 flex-auto">
                  <p className="text-[15px]">
                    <TextBone className={w} />
                  </p>
                  <p className="mt-0.5 text-sm leading-normal">
                    <TextBone className="w-4/5" />
                  </p>
                </div>
                <span className="text-[13px]">
                  <TextBone className="w-6" />
                </span>
              </div>
            ))}
          </div>
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 rounded-[10px] border border-line bg-surface p-4">
            <div className="flex items-center gap-2.5">
              <Bone pill className="size-12 shrink-0" />
              <Bone className="h-5 w-32" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 9 }, (_, i) => (
                <Bone key={i} className="h-11 w-11" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLoading>
  );
}
