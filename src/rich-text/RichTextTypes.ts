import type { Overwrite } from "../utils/helper-types";

/**
 * Type guard to check if the data is the root element.
 */
export function isRootElement(data: RichTextElementModel | undefined): data is {
  tag: "#root";
  attributes?: Record<string, unknown>;
  elements?: RichTextElementModel[];
  blocks?: Array<RenderBlockContext>;
} {
  return !!data && data.tag === "#root";
}

/**
 * Type guard to check if the data is a text element.
 */
export function isTextElement(
  data: RichTextElementModel,
): data is { tag: "#text"; text: string } {
  return data.tag === "#text";
}

/**
 * Type guard to check if the data is a comment element.
 */
export function isCommentElement(
  data: RichTextElementModel,
): data is { tag: "#comment"; text: string } {
  return data.tag === "#comment";
}

/**
 * Type guard to check if the data has elements. Some HTML elements, like `<img>` won't have elements.
 */
export function hasElements(
  data: RichTextElementModel,
): data is { tag: string; elements: RichTextElementModel[] } {
  return "elements" in data;
}

/**
 * Type guard to check if the data is an Umbraco block element.
 */
export function isUmbracoBlock(data: RichTextElementModel): data is {
  tag: string;
  attributes: {
    "content-id": string;
  };
  elements: RichTextElementModel[];
} {
  return data.tag === "umb-rte-block" || data.tag === "umb-rte-block-inline";
}

/**
 * Type guard to check if the data is an HTML element.
 * If data doesn't match of the other known elements, assume it's an HTML element.
 */
export function isHtmlElement(data: RichTextElementModel): data is {
  tag: keyof HTMLElementTagNameMap;
  attributes: Record<string, unknown> & { route?: RouteAttributes };
  elements?: RichTextElementModel[];
} {
  return (
    "tag" in data &&
    !isTextElement(data) &&
    !isCommentElement(data) &&
    !isRootElement(data) &&
    !isUmbracoBlock(data)
  );
}

interface BaseBlockItemModel {
  content?: {
    id: string;
    properties: {
      [key: string]: unknown;
    };
  };
  settings?: {
    id: string;
    properties: {
      [key: string]: unknown;
    };
  };
}

/**
 * Override the block item model with Umbraco specific properties.
 * This way you can get the full type safety of the Umbraco API you are using.
 *
 * **umbraco-rich-text.d.ts**
 * ```ts
 * import { components } from '@/openapi/umbraco';
 *
 * // Define the intermediate interface
 * type ApiBlockItemModel = components['schemas']['ApiBlockItemModel'];
 *
 * declare module '@charlietango/umbraco-rich-text' {
 *   interface UmbracoBlockItemModel extends ApiBlockItemModel {}
 * }
 * ```
 */
export interface UmbracoBlockItemModel {
  _overrideImplementation?: never;
}

/**
 * The merged block context with the Umbraco block item model, and the user-defined block item model.
 */
export type RenderBlockContext = Overwrite<
  BaseBlockItemModel,
  Omit<UmbracoBlockItemModel, "_overrideImplementation">
>;

export interface RouteAttributes {
  path: string;
  startItem: {
    id: string;
    path: string;
  };
}

/**
 * The possible values for the rich text node from Umbraco.
 */
export type RichTextElementModel =
  | {
      tag: "#root";
      attributes?: Record<string, unknown>;
      elements?: RichTextElementModel[];
      blocks?: Array<RenderBlockContext>;
    }
  | {
      tag: "#text";
      text: string;
    }
  | {
      tag: "#comment";
      text: string;
    }
  | {
      tag: "umb-rte-block" | "umb-rte-block-inline";
      attributes: {
        "content-id": string;
      };
      elements: RichTextElementModel[];
    }
  | {
      tag: keyof HTMLElementTagNameMap;
      attributes: Record<string, unknown> & { route?: RouteAttributes };
      elements?: RichTextElementModel[];
    }
  // Fall back to a generic object, so we can handle the basic generated structure provided by the Umbraco OpenAPI spec.
  // It only includes `tag: string` in the definition.
  | {
      tag: string;
      text?: string;
      attributes?: Record<string, unknown>;
      elements?: RichTextElementModel[];
      blocks?: Array<RenderBlockContext>;
    };
