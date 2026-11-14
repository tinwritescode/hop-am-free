import type { NewSong } from "@/lib/song";

/** Songs inserted by `pnpm db:seed` (idempotent: existing slugs are skipped). */
export const SEED_SONGS: NewSong[] = [
  {
    slug: "de-no-den",
    title: "Để Nó Đến",
    artist: "G Thắng",
    composer: "Vũ Đinh Trọng Thắng",
    key: "G",
    rhythm: "Ballad",
    genre: "Pop",
    contributor: "HanYoo",
    sourceUrl: null,
    sheet: `## Intro
[Cmaj7] [Gmaj7] [Cmaj7] [Gmaj7] [Bb] [Am7] [Abmaj7] [G]
## Phiên khúc 1
Để nó [C] đến như lẽ đương [G] nhiên
Để lòng [Cmaj7] em nhặt lên nặng trĩu đặt xuống nhẹ như cơn gió bên [G] hiên
Và để gió cuốn [Bb] đi dịu dàng
[Am7] Chớ vội vàng [Ab] với điệu nhạc của [G] anh
## Phiên khúc 2
Giận hôm [C] đấy không thấy em [G] qua
Sợ em [Cmaj7] quá để tâm và tấm bình phong để phòng ngăn cách hai [G] ta
Em biết [Bb] không làm gì [Am7] cũng bội tình
[Ab] Với người tình thế [G] thôi
## Điệp khúc
Và chỉ khi em [Cmaj7] thấy có nước mắt [G/B] thấy có trống vắng
[Bbmaj7] Khi em chỉ sống cho riêng [Am7] mình
Tìm lại tên [C6] em trong lãng quên [G/B] em khi mới quen anh
Người chôn [Bb] giấu đã [Asus4] lâu [A]
Dù cho em [Cmaj7] níu giữ tới đâu [G/B] cố chấp mấy câu
Giờ nói [Bb] hết quá vội vàng trong mắt [Am7] em
Chỉ cần em [C6] yêu anh thế thôi
[G] Coi như nói xong rồi [Bbmaj7] [Bbmaj7]
## Gian tấu
[Cmaj7] [Gmaj7] [Cmaj7] [Gmaj7] [Bb] [Am7] [Abmaj7] [G]
## Đoạn chuyển
[Cmaj7] Hòn đá lăn trên đồi [G/B] đã lăn đâu rồi
[Bb] Sao em còn mãi mong mơ chờ [Am7] ai
[Cmaj7] Đã xa em rồi (đã xa em rồi)
[G/B] Đã rất xa ngày mai (rất xa ngày mai)
Để còn [Bb] bước đi không trở lại
[Asus4] Ngỡ như chưa tồn [A] tại
## Điệp khúc 2
(Chỉ vì) Để em [Cmaj7] thấy có nước mắt (thấy có nước mắt)
[G/B] Thấy có trống vắng (thấy có trống vắng)
[Bb] Khi em chỉ sống cho riêng [Asus4] mình [A] (khi em để lại...)
Để lại tên [C6] em trong lãng quên [G/B] em khi mới quen anh
Người chôn [Bb] giấu đã [Asus4] lâu [A]
Dù cho em [Cmaj7] níu giữ tới đâu [G/B] cố chấp mấy câu
Giờ nói [Bb] hết quãng thời gian trong mắt [Am7] em buồn
Chỉ cần em [C6] yêu anh thế thôi
[G/B] Coi như nói xong rồi [Bbmaj7] [A] [Bbmaj7] [Dmaj7]
## Điệp khúc cuối
[Cmaj7] Để thấy có nước mắt (thấy có nước mắt)
[G/B] Thấy có trống vắng (thấy có trống vắng)
[Bb] Khi em chỉ sống cho riêng [Am7] mình (khi em để lại...)
Để lại tên [C6] em trong lãng quên
[G/B] Em khi mới quen anh [Bbmaj7] [Bbmaj7]
## Outro
Để nó [Cmaj7] đến như lẽ đương [Gmaj7] nhiên`,
  },
];
