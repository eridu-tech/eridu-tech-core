/**
 * Surfaces the `file=` meta token used by `remark-code-import` as a Docusaurus
 * code block title.
 *
 * Docusaurus only renders a code block header when the fence meta contains a
 * *quoted* `title="..."` value (see `parseCodeBlockTitle` in
 * `@docusaurus/theme-common`). `remark-code-import` inlines the referenced file
 * but leaves the `file=...` token untouched, so the imported path is never
 * displayed on its own.
 *
 * This plugin copies the imported path into a `title` meta token, unless an
 * explicit title was already provided. It runs for every code fence, so the
 * ```` ```ts file=./samples/foo.ts ```` blocks show `./samples/foo.ts` as the
 * code block header without having to add `title=` to each fence by hand.
 */
import type { Code, Parent, Root, RootContent } from "mdast";

/** Same shape Docusaurus uses to detect an explicit code block title. */
const explicitTitleRegex = /title=(?<quote>["'])(?<title>.*?)\1/;

/** A `remark-code-import` meta token: `file=<path>` with an optional `#L1-L2` range. */
const fileMetaRegex = /^file=(?<path>.+?)(?:#.*)?$/;

function forEachCode(node: RootContent, callback: (code: Code) => void): void {
    if (node.type === "code") {
        callback(node);
        return;
    }

    if ("children" in node) {
        for (const child of (node as Parent).children) {
            forEachCode(child, callback);
        }
    }
}

export default function remarkCodeFileTitle() {
    return (tree: Root): void => {
        for (const node of tree.children) {
            forEachCode(node, (code) => {
                const meta = code.meta ?? "";

                // Never override a title the author set explicitly.
                if (explicitTitleRegex.test(meta)) {
                    return;
                }

                const fileMeta = meta
                    .split(/(?<!\\) /g)
                    .find((token) => token.startsWith("file="));
                if (!fileMeta) {
                    return;
                }

                const filePath = fileMetaRegex.exec(fileMeta)?.groups?.["path"];
                if (!filePath) {
                    return;
                }

                // Un-escape spaces (`file=./my\ file.ts`) for display.
                const title = filePath.replace(/\\ /g, " ");
                code.meta = `${meta} title="${title}"`;
            });
        }
    };
}
