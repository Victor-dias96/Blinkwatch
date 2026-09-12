const LOCK_FILES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];

function toPosixPath(file) {
  return file.replaceAll('\\', '/');
}

function excludeLockFiles(files) {
  return files.filter(
    (file) => !LOCK_FILES.some((lockFile) => file.endsWith(lockFile))
  );
}

function excludeMediaPipeWasm(files) {
  return files.filter(
    (file) => !toPosixPath(file).includes('/public/mediapipe/wasm/')
  );
}

/** @type {import('lint-staged').Configuration} */
const config = {
  '**/*.{js,jsx,mjs,cjs,mts,ts,tsx}': (files) => {
    const filtered = excludeMediaPipeWasm(files);

    return filtered.length > 0
      ? [
          `eslint --fix ${filtered.join(' ')}`,
          `prettier --write ${filtered.join(' ')}`,
        ]
      : [];
  },
  '**/*.{css,scss,json,jsonc,md,mdx,yaml,yml}': (files) => {
    const filtered = excludeLockFiles(files);

    return filtered.length > 0
      ? [`prettier --write ${filtered.join(' ')}`]
      : [];
  },
};

export default config;
