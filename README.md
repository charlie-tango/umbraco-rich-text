# react-umbraco

[![npm version][npm-version-src]][npm-version-href]
[![License][license-src]][license-href]

A collection of React components for working with the Umbraco
[Content Delivery API](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api).

## Install

Install the `@charlietango/react-umbraco` package with your package manager of
choice.

```sh
npm install @charlietango/react-umbraco
```

## `<UmbracoRichText>`

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/charlie-tango/react-umbraco/tree/main?file=examples/UmbracoRichText/src/RichText.tsx)

Takes the rich text property from the Umbraco Content Delivery API and renders
it with React.

### Props

- `element`: The rich text property from the Umbraco Content Delivery API.
- `renderBlock`: Render a specific block type.
- `renderNode`: Overwrite the default rendering of a node. Return `undefined` to
  render the default node. Return `null` to skip rendering the node.
- `htmlAttributes`: Default attributes to set on the defined HTML elements.
  These will be used, unless the element already has the attribute set. The only
  exception is the `className` attribute, which will be merged with the default
  value.
- `stripStyles`: Remove inline style attributes from HTML elements. Accepts:
  - `true`: Removes all inline styles from all HTML elements
  - An object with configuration options:
    - `tags`: Array of HTML tags from which to strip styles. If not provided,
      styles are stripped from all tags.
    - `except`: Array of HTML tags that should keep their styles, even if they
      are in the `tags` array.
  - Default is `false` (all inline styles are preserved).

When passing the `renderBlock` and `renderNode` props, consider making them
static functions (move them outside the consuming component) to avoid
unnecessary re-renders.

```tsx
import {
  UmbracoRichText,
  RenderBlockContext,
  RenderNodeContext,
} from "@charlietango/react-umbraco";
import Image from "next/image";
import Link from "next/link";

function renderNode({ tag, children, attributes }: RenderNodeContext) {
  switch (tag) {
    case "a":
      return <Link {...attributes}>{children}</Link>;
    case "p":
      return (
        <p className="text-lg" {...attributes}>
          {children}
        </p>
      );
    default:
      // Return `undefined` to render the default HTML node
      return undefined;
  }
}

function renderBlock({ content }: RenderBlockContext) {
  switch (content?.contentType) {
    // Switch over your Umbraco document types that can be rendered in the Rich Text blocks
    case "imageBlock":
      return <Image {...content.properties} />;
    default:
      return null;
  }
}

function RichText({ data }) {
  return (
    <UmbracoRichText
      data={data.richText}
      renderNode={renderNode}
      renderBlock={renderBlock}
      htmlAttributes={{ p: { className: "mb-4" } }}
      stripStyles={{
        // Strip styles from all tags except the following:
        except: ["img"], // Keep styles on `img` tags
      }}
    />
  );
}
```

### Blocks

You can augment the `renderBlock` method with the generated OpenAPI types from
Umbraco Content Delivery API. That way you can correctly filter the blocks you
are rendering, based on the `contentType`, and get the associated `properties`.
Create `types/react-umbraco.d.ts`, and augment the `UmbracoBlockItemModel`
interface with your applications definition for `ApiBlockItemModel`.

To generate the types, you'll want to use the
[Delivery Api Extensions](https://marketplace.umbraco.com/package/umbraco.community.deliveryapiextensions)
package, alongside a tool to generate the types from the OpenAPI schema, like
[openapi-typescript](https://openapi-ts.pages.dev/).

**types/react-umbraco.d.ts**

```ts
import { components } from "@/openapi/umbraco";

// Define the intermediate interface
type ApiBlockItemModel = components["schemas"]["ApiBlockItemModel"];

declare module "@charlietango/react-umbraco" {
  interface UmbracoBlockItemModel extends ApiBlockItemModel {}
}
```

## `richTextToPlainText`

A utility function to convert an Umbraco RichText element to plain text. This
can be useful for generating meta descriptions or other text-based properties.

### Parameters

- `data` (`RichTextElementModel`): The rich text element to be converted.
- `options` (`Options`, _optional_): An object to specify additional options.
  - `firstParagraph` (`boolean`, _optional_): If `true`, only the first
    paragraph with text content will be returned.
  - `maxLength` (`number`, _optional_): The maximum length of the returned text.
    If the text exceeds this length, it will be truncated to the nearest word
    and an ellipsis will be added.
  - `ignoreTags` (`Array<string>`, _optional_): An array of tags to be ignored
    during the conversion.

### Returns

- `string`: The plain text representation of the rich text element.

### Example

```ts
import { richTextToPlainText } from "@charlietango/react-umbraco";

const plainText = richTextToPlainText(richTextData);

// Just the first paragraph
const firstParagraph = richTextToPlainText(richTextData, {
  firstParagraph: true,
});

// Just the first 100 characters, truncated at the nearest word with an ellipsis
const first100Characters = richTextToPlainText(richTextData, {
  maxLength: 100,
});

// Ignore certain tags, skipping their content
const ignoreTags = richTextToPlainText(richTextData, {
  ignoreTags: ["h1", "h2", "ol", "figure"],
});
```

<!-- Badges -->

[npm-version-src]:
  https://img.shields.io/npm/v/@charlietango/react-umbraco?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@charlietango/react-umbraco
[license-src]:
  https://img.shields.io/github/license/charlie-tango/react-umbraco.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/charlie-tango/react-umbraco/blob/main/LICENSE
