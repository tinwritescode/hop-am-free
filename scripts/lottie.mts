// Regenerates the Lottie files from the drawings: Mầm's page-loading animation per skin, and the small effects. `pnpm lottie`.
import { writeFileSync } from "node:fs";
import { EFFECT_IDS, effectLottie } from "@/lottie/effects";
import { mamLottie } from "@/lottie/mam";
import { SKINS } from "@/themes";

const write = (name: string, data: unknown) => {
  const file = new URL(`../src/lottie/${name}.json`, import.meta.url);
  writeFileSync(file, `${JSON.stringify(data)}\n`);
  console.log(`wrote ${file.pathname}`);
};

for (const skin of SKINS) write(`mam-${skin.id}`, mamLottie(skin));
for (const id of EFFECT_IDS) write(`fx-${id}`, effectLottie(id));
