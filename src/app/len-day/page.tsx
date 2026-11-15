import type { Metadata } from "next";
import { PageHeading } from "@/components/site/PageHeading";
import { Tuner } from "@/components/tuner/Tuner";

export const metadata: Metadata = {
  title: "Lên dây đàn guitar",
  description: "Lên dây đàn guitar online bằng micro điện thoại hoặc máy tính: chuẩn EADGBE, Drop D, hạ nửa cung, DADGAD. Âm thanh không rời khỏi máy.",
};

export default function TunerPage() {
  return (
    <main className="mx-auto max-w-[640px]">
      <PageHeading title="Lên dây đàn">Gảy từng dây gần micro, chiếc đèn lồng sáng lên khi dây đúng nốt. Không có micro thì bấm một dây để nghe nốt mẫu rồi chỉnh theo tai.</PageHeading>
      <Tuner />
    </main>
  );
}
