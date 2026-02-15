/**
 * Copies onnxruntime-web WASM files to public/ort-wasm/ so they can be
 * served locally instead of fetched from a CDN.
 *
 * Run automatically via the "postinstall" npm script.
 */

const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "onnxruntime-web", "dist");
const dest = path.join(__dirname, "..", "public", "ort-wasm");

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

const files = fs.readdirSync(src).filter(
  (f) => f.startsWith("ort-wasm-simd-threaded") && (f.endsWith(".mjs") || f.endsWith(".wasm"))
);

for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
  console.log(`  copied ${file}`);
}

console.log(`Done – ${files.length} files copied to public/ort-wasm/`);
