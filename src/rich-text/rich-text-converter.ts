import { decode } from "html-entities";
import {
  hasElements,
  isCommentElement,
  isTextElement,
  type RichTextElementModel,
} from "./RichTextTypes";

/**
 * Iterate over the rich text and find all text elements.
 */
function iterateRichText(
  data: RichTextElementModel,
  acc: string[],
  options: Options,
  state: { length: number },
) {
  // Iterate over the elements in the rich text, and find all `#text` elements
  if (isTextElement(data)) {
    // Decode the text and remove any extra whitespace/line breaks
    const decodedText = decode(data.text).trim().replace(/\s+/g, " ");
    // If the text is the first element, or the first character is a special character, don't add a space
    if (acc.length === 0 || decodedText.charAt(0).match(/[.,?!:;]/)) {
      acc.push(decodedText);
      state.length += decodedText.length;
    } else {
      const part = ` ${decodedText}`;
      acc.push(part);
      state.length += part.length;
    }
    return acc;
  }

  if (
    isCommentElement(data) ||
    options.ignoreTags?.includes(data.tag as keyof HTMLElementTagNameMap)
  ) {
    return acc;
  }

  if (hasElements(data)) {
    for (let i = 0; i < data.elements.length; i++) {
      iterateRichText(data.elements[i], acc, options, state);
      if (options.maxLength && state.length >= options.maxLength) {
        return acc;
      }
    }
  }
  return acc;
}

/**
 * Iterate over the rich text and find the first element with the given tag - that also has content.
 */
function findElement(
  data: RichTextElementModel,
  tag: string,
): RichTextElementModel | undefined {
  if (data.tag === tag) {
    // Ensure the element is or has text content before returning it.
    if (data.tag === "#text") return data;
    return findElement(data, "#text") ? data : undefined;
  }
  if (data.tag === "#text" || data.tag === "#comment") {
    return undefined;
  }

  if (hasElements(data)) {
    for (let i = 0; i < data.elements.length; i++) {
      const result = findElement(data.elements[i], tag);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
}

type Options = {
  firstParagraph?: boolean;
  maxLength?: number;
  ignoreTags?: Array<keyof HTMLElementTagNameMap>;
};

/**
 * Convert an Umbraco RichText element to plain text.
 * Optional specify that only the first paragraph (with text content) should be returned.
 * When joining the text elements, it will trim whitespace, and add space between elements - Unless the first character is a special character, like a period or comma.
 */
export function richTextToPlainText(
  data: RichTextElementModel | undefined | null,
  options: Options = {},
) {
  if (!data) {
    return "";
  }
  // Iterate over the elements in the rich text, and find all `#text` elements
  const content = options.firstParagraph ? findElement(data, "p") : data;
  if (!content) {
    return "";
  }
  const output = iterateRichText(content, [], options, { length: 0 }).join("");
  if (options.maxLength && output.length > options.maxLength) {
    // If the output is longer than the maxLength, truncate it to nearest word, and add ellipsis
    return `${output.slice(0, options.maxLength).replace(/[.,]?\s+\S*$/, "")}...`;
  }
  return output;
}
