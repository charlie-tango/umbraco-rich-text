import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import type { RichTextElementModel } from "../RichTextTypes";
import { UmbracoRichText } from "../UmbracoRichText";
import fixture from "./__fixtures__/UmbracoRichText.fixture.json";

/**
 * These tests run in the "node" vitest project (see vitest.config.ts) using
 * `react-dom/server`'s `renderToString`, without ever touching a DOM. This
 * proves `UmbracoRichText` can render on the server, which is a prerequisite
 * for React Server Components (RSC) support.
 *
 * Note: `renderToString` exercises SSR, not the stricter `react-server`
 * module-resolution condition that real RSC bundlers use. See the static
 * source-assertion test below, which covers the RSC-specific requirement
 * (no hooks) that `renderToString` alone cannot verify — hooks like
 * `useState` render fine under `renderToString` but are disallowed in RSC.
 */

test("renders fixture content via renderToString without throwing", () => {
  const html = renderToString(
    <UmbracoRichText
      // biome-ignore lint/suspicious/noExplicitAny: The fixture is typed as any to avoid type issues.
      data={fixture as any}
      renderBlock={() => null}
    />,
  );

  // Verified present in the fixture's first element (an <h2>).
  expect(html).toContain("What to expect from here on out");
});

test("renders anchor href and htmlAttributes via renderToString", () => {
  const data: RichTextElementModel = {
    tag: "#root",
    elements: [
      {
        tag: "a",
        attributes: { href: "/path" },
        elements: [{ tag: "#text", text: "link text" }],
      },
      {
        tag: "p",
        attributes: {},
        elements: [{ tag: "#text", text: "paragraph text" }],
      },
    ],
  };

  const html = renderToString(
    <UmbracoRichText data={data} htmlAttributes={{ p: { className: "x" } }} />,
  );

  expect(html).toContain('href="/path"');
  expect(html).toContain(">link text<");
  expect(html).toContain('class="x"');
  expect(html).toContain(">paragraph text<");
});

/**
 * True RSC verification (spike investigation, documented in the plan 008
 * findings report): a third vitest project with `resolve.conditions:
 * ["react-server"]` was investigated to run a test through the actual
 * `react-server` module-resolution condition.
 *
 * That path is blocked without adding a new dependency: under the
 * `react-server` condition, `react-dom`'s `./server`, `./server.edge`, and
 * `./server.node` subpaths all resolve to the same `server.react-server.js`
 * file, which unconditionally throws `"react-dom/server is not supported in
 * React Server Components."` react-dom does not itself implement an RSC
 * renderer — that requires `react-server-dom-webpack` (or an equivalent
 * bundler-specific package), which is out of scope for this spike (no new
 * dependencies). This was confirmed by running:
 *   node --conditions react-server -e
 *     "import('react-dom/server.edge').then(m => console.log(m))"
 * which throws that exact error at module-load time, before any component
 * code runs.
 *
 * As authorized by the plan's Step 2 fallback, we instead assert statically
 * that the component source contains no hook calls — the concrete property
 * that would make the component RSC-incompatible (hooks throw under a real
 * `react-server` condition; `renderToString` above cannot catch this because
 * hooks execute happily during plain SSR).
 */
test("UmbracoRichText source contains no React hook calls", () => {
  const componentPath = fileURLToPath(
    new URL("../UmbracoRichText.tsx", import.meta.url),
  );
  const source = readFileSync(componentPath, "utf-8");

  expect(source).not.toMatch(
    /\buse(State|Effect|Memo|Callback|Ref|Context|Reducer|LayoutEffect|Id|SyncExternalStore|Transition|DeferredValue|ImperativeHandle|InsertionEffect|ActionState|Optimistic)\s*\(/,
  );
  expect(source).not.toMatch(/^["']use client["'];?/m);
});
