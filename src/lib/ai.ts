import "server-only";
import { createHash } from "node:crypto";
import OpenAI from "openai";
import { z } from "zod";
import { cached } from "@/db/cache";
import type { Song, SongDraft } from "./song";
import { SongDraftSchema } from "./song";
import { chordsInOrder, sheetForPrompt } from "./chordsheet";
import { DIFFICULTY_LABEL, difficultyOf, voicingsFor } from "./chords";
import { AiResultSchema, parseAiOutput, type AiResult, type AiTask } from "./ai-schema";
import { RhythmSuggestionsSchema, STROKES, TIME_SIGNATURES, type RhythmSuggestion } from "./rhythm";
import type { PageText } from "./crawl";
import { CapoFretSchema, CapoGuessSchema, parseCapoMention, type Capo, type CapoGuess } from "./capo";

const Env = z.object({ AI_BASE_URL: z.url(), AI_API_KEY: z.string().min(1), AI_MODEL: z.string().min(1) });

let client: { openai: OpenAI; model: string } | null = null;
function getClient() {
  if (client) return client;
  const env = Env.parse(process.env);
  client = { openai: new OpenAI({ baseURL: env.AI_BASE_URL, apiKey: env.AI_API_KEY, timeout: 120_000 }), model: env.AI_MODEL };
  return client;
}

const SYSTEM = `Bạn là "Mầm", trợ giảng guitar thân thiện của trang Hợp Âm Free. Trả lời bằng tiếng Việt, ngắn gọn, cụ thể, dựa trên lý thuyết nhạc đúng.
Chỉ dùng tên hợp âm dạng chuẩn (C, Am7, Bbmaj7, G/B, Asus4...). Không bịa thông tin về bản thu; khi không chắc, nói là "nên nghe lại bản thu".
Luôn trả về đúng một object JSON theo mẫu được yêu cầu, không kèm chữ nào khác.`;

async function askJson(prompt: string): Promise<unknown> {
  const { openai, model } = getClient();
  const res = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ],
  });
  try {
    return JSON.parse(res.choices[0]?.message.content ?? "");
  } catch {
    return undefined;
  }
}

const songHead = (song: Song) =>
  `Bài: ${song.title} – ${song.artist}. Tone: ${song.key}.${song.rhythm ? ` Điệu ghi trong bản gốc: ${song.rhythm}.` : ""}\nHợp âm (mỗi dòng có số thứ tự):\n${sheetForPrompt(song.sheet)}`;

function taskPrompt(task: AiTask, song: Song): string {
  const head = songHead(song);
  switch (task) {
    case "tour":
      return `${head}

Tạo một "tour" 4–6 bước dẫn người mới tập bài này: vòng hợp âm chính, hợp âm lạ/mượn và vì sao nó hay, đường bass, hợp âm khó và mẹo chuyển hợp âm. Mỗi bước 1–3 câu.
JSON: {"steps":[{"title":"...","body":"...","chords":["tên hợp âm có trong bài"]}]}`;
    case "review":
      return `${head}

Soát lỗi bản hợp âm này: hợp âm không thống nhất giữa các đoạn lặp lại, hợp âm nghi chép nhầm, lời không khớp giữa các điệp khúc. Chỉ nêu lỗi có căn cứ trong chính văn bản; tối đa 6 lỗi. "line" là số thứ tự dòng. "fix" là đổi một hợp âm trên dòng đó (from phải có trên dòng), hoặc null.
JSON: {"issues":[{"line":0,"kind":"chord|lyric|consistency","title":"...","body":"...","fix":{"from":"Ab","to":"Abmaj7"}}]}`;
    case "easy": {
      const hard = chordsInOrder(song.sheet)
        .map((name) => {
          const [best] = voicingsFor({ name, easiestFirst: true });
          return `${name}: ${best ? DIFFICULTY_LABEL[difficultyOf(best)] : "không có thế bấm"}`;
        })
        .join(", ");
      return `${head}
Độ khó thế bấm dễ nhất hiện có của từng hợp âm: ${hard}.

Gợi ý thay các hợp âm còn "Khó" hoặc "Vừa" bằng hợp âm dễ bấm hơn mà vẫn giữ cảm xúc của bài (giữ chức năng hòa âm và nốt bass khi có thể; không thay hợp âm mượn tạo nên chất của bài bằng hợp âm khác chức năng). Không thay hợp âm đã "Dễ".
JSON: {"summary":"1–2 câu","subs":[{"from":"Bb","to":"...","reason":"..."}]}`;
    }
    case "rich":
      return `${head}

Gợi ý nâng cấp bằng hợp âm màu (add9, maj9, m9, 7sus4, 6/9, 13...) cho nghe "đã" hơn mà vẫn hợp giai điệu và giữ đường bass. Chọn hợp âm guitar bấm được.
JSON: {"summary":"1–2 câu","subs":[{"from":"Cmaj7","to":"Cmaj9","reason":"..."}]}`;
    default: {
      const _exhaustive: never = task;
      return _exhaustive;
    }
  }
}

const contentHash = (parts: string[]) => createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);

/** Cached in the database per song content, so each task costs one model call per version of a song. */
export function runAiTask(task: AiTask, song: Song): Promise<AiResult> {
  return cached({
    key: `ai:v1:${task}:${song.slug}:${contentHash([song.title, song.key, song.raw])}`,
    schema: AiResultSchema,
    compute: async () => {
      const result = parseAiOutput({ task, sheet: song.sheet, data: await askJson(taskPrompt(task, song)) });
      if (!result) throw new Error(`AI output for ${task} failed validation`);
      return result;
    },
  });
}

export async function suggestRhythms({ song, catalog }: { song: Song; catalog: { slug: string; name: string; timeSignature: string }[] }): Promise<RhythmSuggestion[]> {
  const known = catalog.length ? catalog.map((r) => `- ${r.slug}: ${r.name} (${r.timeSignature})`).join("\n") : "(chưa có)";
  const prompt = `${songHead(song)}

Chọn 2–4 điệu đệm guitar phổ biến ở Việt Nam hợp với bài này (ví dụ Ballad, Slow Rock, Bolero, Pop, Blues, Valse, Fox, Disco, Chachacha, Bossa Nova, Rumba, Tango, Boston, Slow Surf), điệu hợp nhất đứng đầu.
Điệu đã có trong thư viện:
${known}
Nếu dùng điệu đã có: "slug" đúng như trên, "pattern": null.
Nếu là điệu mới: đặt "slug" kiểu kebab-case không dấu, và "pattern" mô tả một ô nhịp của một kiểu đánh phổ biến của điệu đó:
- "timeSignature": một trong ${TIME_SIGNATURES.join(", ")}
- "subdivision": số bước mỗi phách (1, 2 = móc đơn, 3 = chùm ba, 4 = móc kép)
- "steps": đúng (số phách × subdivision) phần tử, mỗi phần tử một trong ${STROKES.join(" ")}. D = quạt xuống, U = quạt lên, B = ngón cái gảy nốt bass, X = chặn tiếng, 1/2/3 = móc dây 1/2/3, - = nghỉ.
- "bpm": tốc độ gợi ý cho bài này; "feel": cảm giác của điệu (1 câu); "howTo": hướng dẫn tay phải từng bước cho người mới (2–4 câu).
"reason": vì sao điệu hợp bài này (1 câu).
JSON: {"rhythms":[{"slug":"ballad","reason":"...","pattern":null},{"slug":"slow-rock","reason":"...","pattern":{"name":"Slow Rock","timeSignature":"12/8","subdivision":1,"bpm":60,"steps":["B","3","2","1","2","3","B","3","2","1","2","3"],"feel":"...","howTo":"..."}}]}`;
  const parsed = RhythmSuggestionsSchema.safeParse(await askJson(prompt));
  if (!parsed.success) throw new Error("AI rhythm suggestions failed validation");
  return parsed.data.rhythms;
}

// The model reports a capo only when the page states it, so an extracted capo counts as stated by the sheet.
const ImportedSchema = SongDraftSchema.omit({ sourceUrl: true, capo: true }).extend({ capo: CapoFretSchema.nullable().default(null) });

/** Turns crawled page text into a clean draft; cached per URL so re-importing the same link is free. */
export async function importSong({ url, page }: { url: string; page: PageText }): Promise<Omit<SongDraft, "sourceUrl">> {
  const { capo, ...draft } = await cached({
    key: `import:v2:${url}`,
    schema: ImportedSchema,
    compute: async () => {
      const prompt = `Dưới đây là nội dung một trang web về một bài hát (đã bỏ HTML). Hãy trích ra bản hợp âm guitar và làm sạch nó.
Quy tắc cho "sheet":
- Mỗi dòng lời một dòng; hợp âm viết liền trong ngoặc vuông ngay trước chữ được đánh, ví dụ: Để nó [C]đến như lẽ đương [G]nhiên.
- Chia đoạn bằng dòng tiêu đề "## Tên đoạn" (Intro, Phiên khúc 1, Điệp khúc, Gian tấu, Đoạn chuyển, Outro…) khi nhận ra được.
- Giữ nguyên lời và hợp âm của bản gốc; chỉ sửa khoảng trắng, chính tả rõ ràng sai, và chuẩn hóa tên hợp âm (A# → Bb, Hm → Bm, Am7/G giữ nguyên).
- Bỏ hết menu, quảng cáo, bình luận, chữ không thuộc bài hát.
"key" là tone gốc dạng C, Am, F#m, Bb. "artist" là ca sĩ; "composer" là người sáng tác ("" nếu không có). "rhythm" là điệu nếu trang ghi ("" nếu không). "genre" là thể loại nếu có ("" nếu không).
"capo" là số ngăn kẹp capo (0–11) CHỈ KHI bản hợp âm hoặc trang ghi rõ, ví dụ "Capo 3", "capo ngăn 3", "kẹp capo 2", "Capo on 2nd fret"; không ghi thì null. Không tự đoán capo, không suy ra từ tone, không lấy từ bình luận của người đọc.
JSON: {"title":"...","artist":"...","composer":"...","key":"Am","genre":"","rhythm":"","capo":null,"sheet":"## Phiên khúc 1\\nNó như thế [Am]này..."}

Tiêu đề trang: ${page.title}
Mô tả: ${page.description}
Nội dung:
${page.text}`;
      const parsed = ImportedSchema.safeParse(await askJson(prompt));
      if (!parsed.success) throw new Error("AI import failed validation");
      return parsed.data;
    },
  });
  // The model sometimes drops the capo line while cleaning; the sheet itself may still state it.
  const fret = capo ?? parseCapoMention(draft.sheet);
  return { ...draft, capo: fret === null ? null : ({ fret, source: "sheet" } satisfies Capo) };
}

/** Cached per song content, so re-running the backfill asks the model once per version of a song. */
export function guessCapo(song: Song): Promise<CapoGuess> {
  const chords = chordsInOrder(song.sheet);
  return cached({
    key: `capo:v1:${song.slug}:${contentHash([song.title, song.artist, song.key, chords.join(" ")])}`,
    schema: CapoGuessSchema,
    compute: async () => {
      const prompt = `Bài: ${song.title} – ${song.artist}${song.composer ? ` (sáng tác ${song.composer})` : ""}.
Bản hợp âm trên trang viết ở tone ${song.key}. Hợp âm trong bài: ${chords.join(", ")}.

Người chơi guitar muốn đệm theo bản thu gốc hoặc bản thu phổ biến nhất của bài này bằng đúng các thế bấm trên. Họ cần kẹp capo ngăn mấy?
Cách tính: capo = (tone bản thu − tone bản hợp âm) mod 12, tính theo nửa cung. Nếu bản thu ở đúng tone ${song.key} thì capo = 0.
- Chỉ trả lời khi thật sự biết bản thu này và tone của nó. Không biết bài, không chắc bản thu nào, hoặc chỉ đoán theo thói quen: "capo": null.
- "soundingKey" là tone bản thu (cùng giọng trưởng/thứ với ${song.key}), null nếu "capo" là null.
- "confidence": "high" khi chắc chắn tone bản thu, "medium" khi khá chắc, "low" khi chỉ đoán.
- "reason": 1 câu, nêu bản thu nào và tone gì.
JSON: {"capo":3,"confidence":"medium","soundingKey":"Eb","reason":"..."}`;
      const parsed = CapoGuessSchema.safeParse(await askJson(prompt));
      if (!parsed.success) throw new Error("AI capo guess failed validation");
      return parsed.data;
    },
  });
}
