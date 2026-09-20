// Tiled maps are imported as raw text (see the `asset/source` webpack rule in next.config.mjs).
declare module '*.tmj' {
  const content: string;
  export default content;
}
