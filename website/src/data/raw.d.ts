/**
 * Raw file imports handled by the `?raw` webpack rule in `docusaurus.config.ts`.
 * The module's default export is the file's original text.
 */
declare module "*?raw" {
    const content: string;
    export default content;
}
