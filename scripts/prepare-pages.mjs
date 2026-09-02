import { access, cp, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";

const output = new URL("../dist/client/", import.meta.url);
const repositoryAssets = new URL("LUISIR-ict-game-lab/_next/", output);
const rootAssets = new URL("_next/", output);

await writeFile(new URL(".nojekyll", output), "");

try {
  await access(repositoryAssets, constants.R_OK);
  await rm(rootAssets, { recursive: true, force: true });
  await cp(repositoryAssets, rootAssets, { recursive: true });
  await rm(new URL("LUISIR-ict-game-lab/", output), { recursive: true, force: true });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
