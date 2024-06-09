import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";


async function build() {
  process.chdir(path.dirname(process.argv[1]));
  await fs.mkdir("lib", { recursive: true });

  for (const lib of [
    "node_modules/markupchisel/dist/markupchisel.lite.bundle.esm.js",
    "node_modules/markupchisel/gen/test-document.js",
  ]) {
    const dest = `lib/${path.basename(lib)}`;
    await fs.copyFile(lib, `lib/${path.basename(lib)}`);
    const stat = await fs.stat(lib, { bigint: true });
    await fs.utimes(dest, Number(stat.atimeNs) / 1e9, Number(stat.mtimeNs) / 1e9);
  }
}


await build();
