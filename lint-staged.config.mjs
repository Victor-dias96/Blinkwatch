const LOCK_FILES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];

function excludeLockFiles(files) {
  return files.filter(
    (file) => !LOCK_FILES.some((lockFile) => file.endsWith(lockFile))
  );
}

/** @type {import('lint-staged').Configuration} */
const config = {
  '**/*.{js,jsx,mjs,cjs,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{css,scss,json,jsonc,md,mdx,yaml,yml}': (files) => {
    const filtered = excludeLockFiles(files);

    return filtered.length > 0
      ? [`prettier --write ${filtered.join(' ')}`]
      : [];
  },
};

export default config;
