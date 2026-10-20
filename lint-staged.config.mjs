const config = {
  '*.{ts,tsx,mts,js,mjs}': ['eslint --fix --no-warn-ignored', 'prettier --write --ignore-unknown'],
  '*.{json,css,scss,yml,yaml}': ['prettier --write --ignore-unknown'],
}

export default config
