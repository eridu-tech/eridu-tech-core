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
 *
 * A `name=<path>` token replaces the imported path in that header, so a sample
 * that stands for a file in the reader's project is labelled with that path:
 *
 * ````md
 * ```ts file=./samples/create-handler.ts name=app/routes/api.$.ts
 * ```
 * ````
 *
 * The `name=` token is stripped from the meta, since it only tells this plugin
 * what to display.
 */
import type { Code, Parent, Root, RootContent } from "mdast";

/** Same shape Docusaurus uses to detect an explicit code block title. */
const explicitTitleRegex = /title=(?<quote>["'])(?<title>.*?)\1/;

/** A `remark-code-import` meta token: `file=<path>` with an optional `#L1-L2` range. */
const fileMetaRegex = /^file=(?<path>.+?)(?:#.*)?$/;

/** A `name=<path>` token whose value replaces the displayed title. */
const nameMetaRegex = /^name=(?<name>.+)$/;

/**
 * Splits fence meta on the spaces that sit outside quotes and are not escaped,
 * so `name="src/my file.ts"` and `name=src/my\ file.ts` both stay one token.
 */
function splitMeta(meta: string): Array<string> {
    const tokens: Array<string> = [];
    let token = "";
    let quote: string | null = null;
    let escaped = false;

    for (const character of meta) {
        if (escaped) {
            escaped = false;
        } else if (character === "\\") {
            escaped = true;
        } else if (quote === null && (character === '"' || character === "'")) {
            quote = character;
        } else if (character === quote) {
            quote = null;
        } else if (character === " " && quote === null) {
            tokens.push(token);
            token = "";
            continue;
        }

        token += character;
    }

    tokens.push(token);
    return tokens;
}

/** Un-escapes the spaces of a meta value so it can be displayed. */
function displayPath(value: string): string {
    return value.replace(/\\ /g, " ");
}

/** Reads the value of a `name=` token, quoted (`"..."`, `'...'`) or bare. */
function readName(tokens: Array<string>): string | undefined {
    const token = tokens.find((token) => token.startsWith("name="));
    const value =
        token === undefined
            ? undefined
            : nameMetaRegex.exec(token)?.groups?.["name"];
    if (value === undefined || value === "") {
        return undefined;
    }
    return displayPath(value.replace(/^(["'])(.*)\1$/s, "$2"));
}

/** Reads the path a `file=` token imports: the default title. */
function readFilePath(tokens: Array<string>): string | undefined {
    const token = tokens.find((token) => token.startsWith("file="));
    const path =
        token === undefined
            ? undefined
            : fileMetaRegex.exec(token)?.groups?.["path"];
    return path === undefined ? undefined : displayPath(path);
}

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
                const tokens = splitMeta(meta);

                // The `name=` token only tells this plugin what to display, so
                // it never reaches the rest of the meta.
                const restMeta = tokens.some((token) =>
                    token.startsWith("name="),
                )
                    ? tokens
                          .filter((token) => !token.startsWith("name="))
                          .join(" ")
                    : meta;
                code.meta = restMeta;

                // Never override a title the author set explicitly.
                if (explicitTitleRegex.test(code.meta)) {
                    return;
                }

                const title = readName(tokens) ?? readFilePath(tokens);
                if (title === undefined) {
                    return;
                }

                code.meta = `${code.meta} title="${title}"`.trim();
            });
        }
    };
}
