import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = join(
  repositoryRoot,
  'node_modules',
  '@mediapipe',
  'tasks-vision',
  'wasm'
);
const destinationDirectory = join(
  repositoryRoot,
  'public',
  'mediapipe',
  'wasm'
);

const wasmFiles = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

if (!existsSync(sourceDirectory)) {
  throw new Error(
    `MediaPipe WASM source is missing: ${sourceDirectory}. Install @mediapipe/tasks-vision first.`
  );
}

mkdirSync(destinationDirectory, { recursive: true });

for (const fileName of wasmFiles) {
  const sourcePath = join(sourceDirectory, fileName);

  if (!existsSync(sourcePath)) {
    throw new Error(`Required MediaPipe WASM file is missing: ${fileName}`);
  }

  copyFileSync(sourcePath, join(destinationDirectory, fileName));
}

console.log(
  `Copied ${wasmFiles.length} MediaPipe WASM files to public/mediapipe/wasm`
);
