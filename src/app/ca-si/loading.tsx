import { ArtistCardBone } from "@/components/home/ArtistCard";
import { PageLoading, TextBone } from "@/components/site/Loading";

export default function ArtistsLoading() {
  return (
    <PageLoading label="Mầm đang mở trang…">
      <div className="pt-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <p className="font-serif text-[26px]">
            <TextBone className="w-24" />
          </p>
          <p className="text-sm">
            <TextBone className="w-40" />
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5">
          {Array.from({ length: 16 }, (_, i) => (
            <ArtistCardBone key={i} />
          ))}
        </div>
      </div>
    </PageLoading>
  );
}
