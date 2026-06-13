import { readFile, writeFile, mkdir } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

function extractConstant(name, nextMarker) {
  const start = source.indexOf(`const ${name} =`);
  const end = source.indexOf(nextMarker, start);
  if (start < 0 || end < 0) throw new Error(`Tidak dapat mengekstrak ${name}.`);
  return source.slice(start, end);
}

const storesSource = extractConstant("STORES", "const MONTHS");
const seedSource = extractConstant("SEED_DATA", "// ============ HELPERS");
const context = {};

vm.runInNewContext(
  `${storesSource}\n${seedSource}\nresult = { stores: STORES, seedData: SEED_DATA };`,
  context,
);

const output = new URL("../server/master-data.json", import.meta.url);
await mkdir(new URL("../server/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(context.result, null, 2)}\n`, "utf8");
console.log("server/master-data.json berhasil dibuat.");
