import { decode } from "html-entities";
import * as React from "react";
import { mapHtmlAttributesToReact } from "./attributes-map";
import { parseStyle } from "./parse-style";
import {
  hasElements,
  isHtmlElement,
  isRootElement,
  isTextElement,
  isUmbracoBlock,
  type RenderBlockContext,
  type RichTextElementModel,
  type RouteAttributes,
} from "./RichTextTypes";

const htmlEntityRegex = /&(?:[a-zA-Z]|#)/;
const emptyMeta: NodeMeta = {};

const decodeIfEntities = (value: string) =>
  htmlEntityRegex.test(value) ? decode(value) : value;

const createMetaGetter = (getMetaData?: () => NodeMeta) => {
  if (!getMetaData) return undefined;
  let cachedMeta: NodeMeta | undefined;
  return () => {
    cachedMeta ||= getMetaData();
    return cachedMeta;
  };
};

interface NodeMeta {
  /** The node of the parent element */
  ancestor?: RichTextElementModel;
  /** The nodes of the descendant child elements */
  children?: RichTextElementModel[];
  /** The node of the previous sibling element */
  previous?: RichTextElementModel;
  /** The node of the next sibling element */
  next?: RichTextElementModel;
}

/**
 * Props for rendering a single node in the rich text.
 * A node is any HTML element that is part of the rich text.
 */
export type RenderNodeContext = {
  children?: React.ReactNode;
  /**
   * Lazily evaluated metadata for the current node.
   * Invoke to retrieve ancestor/children/previous/next when needed.
   */
  meta: () => NodeMeta;
} & (
  | {
      [Tag in keyof React.JSX.IntrinsicElements]: {
        tag: Tag;
        attributes: React.JSX.IntrinsicElements[Tag];
      };
    }[keyof Omit<React.JSX.IntrinsicElements, "a">]
  | {
      tag: "a";
      attributes: React.JSX.IntrinsicElements["a"];
      /** The route attributes for internal Umbraco links */
      route?: RouteAttributes;
    }
);

interface RichTextProps {
  data: RichTextElementModel | undefined;
  renderBlock?: (block: RenderBlockContext) => React.ReactNode;
  /**
   * Render an HTML node with custom logic.
   * @param node
   * @returns A React node, `null` to render nothing, or `undefined` to fall back to the default element
   */
  renderNode?: (node: RenderNodeContext) => React.ReactNode | undefined;
  /** Default attributes for HTML elements, used to add default classes to all `<p>` tags.
   * If the html element contains its own attributes, then they will override the default.
   *
   * ```tsx
   * <RichText
   *    htmlAttributes={{
   *      p: { className: 'text-base' },
   *      h1: { className: 'text-2xl' },
   *    }}
   *  />
   *  */
  htmlAttributes?: Partial<{
    [Tag in keyof React.JSX.IntrinsicElements]: React.JSX.IntrinsicElements[Tag];
  }>;
  /**
   * Strip the inline style attributes from the HTML elements
   * This can be a boolean to strip all styles, or an object to specify which tags to strip styles from.
   * If an object is provided, the `tags` property lists tags to strip styles from. If not set, all tags will have their styles stripped.
   * The `except` property can be used to specify tags that should not have their styles stripped, even if they are in the `tags` array.
   *
   * @default false
   */
  stripStyles?:
    | boolean
    | {
        tags?: Array<keyof React.JSX.IntrinsicElements>;
        except?: Array<keyof React.JSX.IntrinsicElements>;
      };
  /**
   * Opt-in sanitization of CMS-authored content. Both options are
   * independently optional; omitting `sanitize` (the default) changes
   * nothing.
   *
   * @default undefined
   */
  sanitize?: {
    /**
     * Allowed URL schemes for `<a href>`, compared case-insensitively
     * without the trailing colon (e.g. `["http", "https", "mailto"]`).
     * Hrefs with no scheme (relative paths, `#hash`, `?query`,
     * protocol-relative `//host`) always pass. When a scheme is present and
     * not in the list, the `href` attribute is removed; the anchor element
     * and its other attributes still render.
     */
    allowedHrefSchemes?: string[];
    /**
     * Strip attributes by name, after HTML-to-React mapping. `true` uses
     * the default unsafe list: event handlers (`/^on[a-z]/i`),
     * `formaction`, and `dangerouslySetInnerHTML`. An array replaces the
     * default list entirely: strings match case-insensitively, RegExps are
     * tested against the mapped attribute name.
     */
    stripAttributes?: boolean | Array<string | RegExp>;
  };
}

const defaultStripAttributes: Array<string | RegExp> = [
  /^on[a-z]/i,
  "formaction",
  "dangerouslySetInnerHTML",
];

function shouldStripAttribute(
  key: string,
  list: Array<string | RegExp>,
): boolean {
  return list.some((entry) =>
    typeof entry === "string"
      ? entry.toLowerCase() === key.toLowerCase()
      : entry.test(key),
  );
}

const hrefSchemeRegex = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function isAllowedHrefScheme(href: string, allowed: string[]): boolean {
  const match = href.match(hrefSchemeRegex);
  if (!match) {
    // No scheme: relative path, #hash, ?query, or protocol-relative //host
    return true;
  }
  const scheme = match[0].slice(0, -1).toLowerCase();
  return allowed.some((entry) => entry.toLowerCase() === scheme);
}

function parseUrl(href: string) {
  try {
    // Try to parse the URL. This will throw if the URL is invalid (e.g., doesn't contain https://)
    return new URL(href);
  } catch {
    // Try with a fake base for relative URLs
    try {
      return new URL(href, "http://localhost/");
    } catch {
      return undefined;
    }
  }
}

/**
 * Render the individual elements of the rich text
 */
function RichTextElement({
  element,
  blocks,
  blocksLookup,
  renderBlock,
  renderNode,
  htmlAttributes = {},
  stripStyles = false,
  sanitize,
  metaGetter,
  provideMeta,
}: {
  element: RichTextElementModel;
  blocks: Array<RenderBlockContext> | undefined;
  metaGetter: (() => NodeMeta) | undefined;
  blocksLookup: Map<string, RenderBlockContext> | undefined;
  provideMeta: boolean;
} & Pick<
  RichTextProps,
  "renderBlock" | "renderNode" | "htmlAttributes" | "stripStyles" | "sanitize"
>) {
  if (!element || element.tag === "#comment" || element.tag === "#root")
    return null;

  const getMeta =
    provideMeta && metaGetter ? createMetaGetter(metaGetter) : undefined;

  if (isTextElement(element)) {
    // Umbraco adds a new line character to the text element between HTML tags. Remove this, so we keep the HTML valid.
    // This is only for cases where the only thing in the text element is a new line - This would just be added to keep the HTML pretty.
    if (element.text === "\n") return null;
    // Decode HTML entities in text nodes
    return decodeIfEntities(element.text);
  }

  // If the tag is a block, skip the normal rendering and render the block
  if (isUmbracoBlock(element)) {
    const contentId = element.attributes?.["content-id"];
    const block =
      contentId &&
      (blocksLookup?.get(contentId) ??
        blocks?.find((item) => item.content?.id === contentId));
    if (renderBlock && block) {
      return renderBlock(block);
    }
    if (typeof renderBlock !== "function") {
      throw new Error(
        "No renderBlock function provided for rich text block. Unable to render block.",
      );
    }

    return null;
  }
  let children: Array<React.ReactNode> | undefined;
  if (isHtmlElement(element)) {
    children = element.elements?.map((node, index) => (
      <RichTextElement
        key={index}
        element={node}
        blocks={blocks}
        blocksLookup={blocksLookup}
        renderBlock={renderBlock}
        renderNode={renderNode}
        stripStyles={stripStyles}
        sanitize={sanitize}
        metaGetter={
          provideMeta
            ? createMetaGetter(() => ({
                ancestor: element,
                children: hasElements(node) ? node.elements : undefined,
                previous: element.elements?.[index - 1],
                next: element.elements?.[index + 1],
              }))
            : undefined
        }
        provideMeta={provideMeta}
      />
    ));
    if (children?.length === 0) {
      children = undefined;
    }

    const { route, style, ...attributes } = mapHtmlAttributesToReact(
      element.attributes,
    );
    const defaultAttributes = htmlAttributes[element.tag];

    if (sanitize?.stripAttributes) {
      const list =
        sanitize.stripAttributes === true
          ? defaultStripAttributes
          : sanitize.stripAttributes;
      for (const key of Object.keys(attributes)) {
        if (shouldStripAttribute(key, list)) {
          delete attributes[key];
        }
      }
    }

    if (element.tag === "a") {
      const hrefFromAttributes = attributes?.href as string | undefined;
      const href = route?.path ?? decodeIfEntities(hrefFromAttributes ?? "");
      const anchorOrQuery =
        attributes.anchor && typeof attributes.anchor === "string"
          ? decodeIfEntities(attributes.anchor)
          : undefined;
      attributes.anchor = undefined;

      if (!anchorOrQuery) {
        // No anchor or query to merge, so leave the href untouched.
        attributes.href = href;
      } else if (!href) {
        // No href to merge into, so use the anchor or query directly.
        attributes.href = anchorOrQuery;
      } else {
        // Preserve protocol-relative hrefs (e.g. "//example.com/x") by parsing
        // them with an explicit scheme, then stripping it back off afterwards.
        const isProtocolRelative = href.startsWith("//");
        const url = parseUrl(isProtocolRelative ? `http:${href}` : href);
        // If the user has added an anchor or query parameter to the href, we need to handle it
        if (url) {
          if (anchorOrQuery?.startsWith("?")) {
            // Add the custom query parameter to the href.
            const queryParams = new URLSearchParams(anchorOrQuery);
            // Add all query parameters to the URL. This will overwrite any existing query parameters with the same key.
            queryParams.forEach((val, key) => {
              url.searchParams.set(key, val);
            });
          } else if (anchorOrQuery) {
            // Append the anchor (hash) to the href
            url.hash = anchorOrQuery;
          }

          const serialized = url.toString();
          attributes.href = isProtocolRelative
            ? serialized.replace(/^http:/, "")
            : serialized.replace(/^http:\/\/localhost\//, "/");
        } else {
          // Fallback to merging the href with the anchor or query parameter
          attributes.href = href + (anchorOrQuery || "");
        }
      }

      if (
        sanitize?.allowedHrefSchemes &&
        typeof attributes.href === "string" &&
        !isAllowedHrefScheme(attributes.href, sanitize.allowedHrefSchemes)
      ) {
        attributes.href = undefined;
      }
    }

    if (attributes.className) {
      if (defaultAttributes?.className) {
        // Merge the default class with the class attribute
        attributes.className = `${defaultAttributes.className} ${attributes.className}`;
      }
    }

    // Handle style attributes
    if (typeof style === "string") {
      // Determine if we should strip styles for this element
      let shouldStripStyles = stripStyles === true;

      if (typeof stripStyles === "object") {
        // If tags array is provided, only strip styles from those tags
        // If tags is not provided, strip from all tags
        const shouldStrip =
          stripStyles.tags?.includes(
            element.tag as keyof React.JSX.IntrinsicElements,
          ) ?? true;

        // Check if this tag is in the except list
        const isExcepted =
          stripStyles.except?.includes(
            element.tag as keyof React.JSX.IntrinsicElements,
          ) || false;

        shouldStripStyles = shouldStrip && !isExcepted;
      }

      // Only parse and add style if we're not stripping it
      if (!shouldStripStyles) {
        attributes.style = parseStyle(style);
      }
    }

    if (renderNode) {
      const output = renderNode({
        // biome-ignore lint/suspicious/noExplicitAny: Avoid complicated TypeScript logic by using any. The type will be corrected in the implementation.
        tag: element.tag as any,
        attributes: {
          ...defaultAttributes,
          ...attributes,
        } as Record<string, unknown>,
        children,
        route,
        meta: getMeta ?? (() => emptyMeta),
      });

      if (output !== undefined) {
        // If we got a valid output from the renderElement function, we return it
        // `null` we will render nothing, but `undefined` fallback to the default element
        return output;
      }
    }

    if (
      element.tag === "p" &&
      element.elements?.length === 1 &&
      isUmbracoBlock(element.elements[0])
    ) {
      // If the paragraph only contains a block, we return the block directly.
      // This avoids wrapping the block in a paragraph tag, which would likely result in invalid HTML.
      return children;
    }

    return React.createElement(
      element.tag,
      htmlAttributes[element.tag]
        ? { ...defaultAttributes, ...attributes }
        : attributes,
      children,
    );
  }
  return undefined;
}

/**
 * Component for rendering a rich text component
 */
export function UmbracoRichText(props: RichTextProps) {
  const rootElement = props.data;
  const blocksLookup = buildBlockLookup(
    isRootElement(rootElement) ? rootElement.blocks : undefined,
  );
  const provideMeta = Boolean(props.renderNode);

  if (isRootElement(rootElement)) {
    return (
      <>
        {rootElement.elements?.map((element, index) => (
          <RichTextElement
            key={index}
            element={element}
            blocks={rootElement.blocks}
            blocksLookup={blocksLookup}
            renderBlock={props.renderBlock}
            renderNode={props.renderNode}
            htmlAttributes={props.htmlAttributes}
            stripStyles={props.stripStyles}
            sanitize={props.sanitize}
            metaGetter={
              provideMeta
                ? createMetaGetter(() => ({
                    ancestor: rootElement,
                    children: hasElements(element)
                      ? element.elements
                      : undefined,
                    previous: rootElement.elements?.[index - 1],
                    next: rootElement.elements?.[index + 1],
                  }))
                : undefined
            }
            provideMeta={provideMeta}
          />
        ))}
      </>
    );
  }

  // If the element is not a root element, we return null
  return null;
}

function buildBlockLookup(
  blocks: Array<RenderBlockContext> | undefined,
): Map<string, RenderBlockContext> | undefined {
  if (!blocks || blocks.length === 0) return undefined;

  const lookup = new Map<string, RenderBlockContext>();
  for (const block of blocks) {
    const id = block.content?.id;
    if (id) {
      lookup.set(id, block);
    }
  }

  return lookup;
}
