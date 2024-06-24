import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";


async function build() {
  process.chdir(path.dirname(process.argv[1]));
  await fs.mkdir("lib", { recursive: true });

  for (const lib of [
    "node_modules/markupchisel/dist/markupchisel.lite.bundle.esm.js",
    "node_modules/markupchisel/gen/test-document.js",
    "node_modules/@fontsource/roboto-mono",
    "node_modules/inter-ui:inter",
  ]) {
    const [libPath, destName] = lib.split(":", 2);
    const destPath = `lib/${destName || path.basename(libPath)}`;
    if ((await fs.stat(libPath)).isDirectory()) {
      await fs.cp(
        libPath,
        destPath,
        { force: true, recursive: true, preserveTimestamps: true },
      );
    } else {
      await fs.copyFile(libPath, destPath);
      const stat = await fs.stat(libPath, { bigint: true });
      await fs.utimes(destPath, Number(stat.atimeNs) / 1e9, Number(stat.mtimeNs) / 1e9);
    }
  }
}


await build();
