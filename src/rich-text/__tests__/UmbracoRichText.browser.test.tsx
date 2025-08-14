import { render } from "vitest-browser-react";
import type { RichTextElementModel } from "../RichTextTypes";
import { UmbracoRichText } from "../UmbracoRichText";
import fixture from "./__fixtures__/UmbracoRichText.fixture.json";

/**
 * Creates nested RichTextElementModel objects with the given tags.
 * @param {...string} tags - The tags to create nested elements with.
 * @returns {RichTextElementModel[]} - The nested RichTextElementModel object.
 */
function nestedElements(...tags: string[]): RichTextElementModel[] {
  return [
    tags.reduceRight<RichTextElementModel>(
      (acc, tag) => {
        return {
          tag,
          attributes: {},
          elements: [acc],
        } as RichTextElementModel;
      },
      { tag: "#text", attributes: {}, text: "text" } as RichTextElementModel,
    ),
  ];
}

it("should not render without #root tag in the root element ", () => {
  const { container } = render(
    <UmbracoRichText data={{ tag: "div", attributes: {} }} />,
  );
  expect(container.innerHTML).toEqual("");
});

it("should not render if the root element is empty", () => {
  const { container } = render(<UmbracoRichText data={{ tag: "#root" }} />);
  expect(container.innerHTML).toEqual("");
});

it("should render nested elements correctly", () => {
  const { container } = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: nestedElements("table", "thead", "tr", "th"),
      }}
    />,
  );
  const table = container.firstChild as HTMLTableElement;
  expect(table.tagName).toBe("TABLE");
  const thead = table.firstChild as HTMLTableSectionElement;
  expect(thead.tagName).toBe("THEAD");
  const tr = thead.firstChild as HTMLTableRowElement;
  expect(tr.tagName).toBe("TR");
  const th = tr.firstChild as HTMLTableCellElement;
  expect(th.tagName).toBe("TH");
  expect(th.textContent).toBe("text");
});

it("should decode and render text correctly", () => {
  const { container } = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "#text",
            text: "&lt; &gt; &quot; &apos; &amp; &#169; &#8710;",
          },
        ],
      }}
    />,
  );
  expect(container).toHaveTextContent("< > \" ' & © ∆");
});

it("should throw an error when rendering a block element without renderBlock prop ", () => {
  // don't log errors to the console when testing for thrown errors
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() =>
    render(
      <UmbracoRichText
        data={{
          tag: "#root",
          elements: [
            {
              tag: "umb-rte-block",
              attributes: { "content-id": "1" },
              elements: [],
            },
          ],
        }}
      />,
    ),
  ).toThrowError();
});

it("should render a block element using the renderBlock prop", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        blocks: [{ content: { id: "1", properties: {} } }],
        elements: [
          {
            tag: "umb-rte-block",
            attributes: { "content-id": "1" },
            elements: [],
          },
        ],
      }}
      renderBlock={(block) => (
        <div data-testid="umb-rte-block">{block?.content?.id}</div>
      )}
    />,
  );

  expect(
    screen.getByTestId("umb-rte-block").element().outerHTML,
  ).toMatchInlineSnapshot(`"<div data-testid="umb-rte-block">1</div>"`);
});

it("should render an inline block element using the renderBlock prop", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        blocks: [{ content: { id: "1", properties: {} } }],
        elements: [
          {
            tag: "umb-rte-block-inline",
            attributes: { "content-id": "1" },
            elements: [],
          },
        ],
      }}
      renderBlock={(block) => (
        <div data-testid="umb-rte-block-inline">{block?.content?.id}</div>
      )}
    />,
  );

  expect(
    screen.getByTestId("umb-rte-block-inline").element().outerHTML,
  ).toMatchInlineSnapshot(`"<div data-testid="umb-rte-block-inline">1</div>"`);
});

it("should handle href attribute on links", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "a",
            attributes: {
              href: "/path",
            },
            elements: [{ tag: "#text", text: "text" }],
          },
        ],
      }}
    />,
  );
  const anchor = screen.getByRole("link").element();
  expect(anchor).toHaveAttribute("href", "/path");
  expect(anchor).not.toHaveAttribute("route");
});

it("should handle route-specific path attribute for the anchor href", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "a",
            attributes: {
              route: { path: "/path", startItem: { id: "1", path: "/path" } },
            },
            elements: [{ tag: "#text", text: "text" }],
          },
        ],
      }}
    />,
  );
  const anchor = screen.getByRole("link").element();
  expect(anchor).toHaveAttribute("href", "/path");
  expect(anchor).not.toHaveAttribute("route");
});

it("should correctly map the class attribute to className", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "input",
            attributes: { class: "example-class" },
          },
        ],
      }}
    />,
  );
  const input = screen.getByRole("textbox").element();
  expect(input).toHaveClass("example-class");
});

it("should properly convert style string to a CSSProperties object and pass it as the className prop to component", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "input",
            attributes: { style: "color: red; background-color: blue" },
          },
        ],
      }}
    />,
  );
  const input = screen.getByRole("textbox").element();
  expect(input).toHaveAttribute("style", "color: red; background-color: blue;");
});

it("should override default node rendering with custom renderNode prop", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "div",
            attributes: {},
          },
        ],
      }}
      renderNode={(node) => <div data-testid="custom-node">{node.tag}</div>}
    />,
  );
  const customNode = screen.getByTestId("custom-node");
  expect(customNode.element().tagName).toBe("DIV");
});

it("should not render node if renderNode prop returns null", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "div",
            attributes: {
              "data-testid": "default-rendering",
            },
          },
        ],
      }}
      renderNode={() => null}
    />,
  );
  expect(() => screen.getByTestId("default-rendering").element()).to.throw();
});

it("should render default node if renderNode prop returns undefined", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "div",
            attributes: {
              "data-testid": "default-rendering",
            },
          },
        ],
      }}
      renderNode={() => undefined}
    />,
  );
  expect(screen.getByTestId("default-rendering")).not.toBeNull();
});

it("should render fixture content correctly", () => {
  const screen = render(
    <UmbracoRichText
      // biome-ignore lint/suspicious/noExplicitAny: The fixture is typed as any to avoid type issues.
      data={fixture as any}
      renderBlock={() => <div data-testid="block" />}
    />,
  );
  expect(screen.container.innerHTML).toMatchSnapshot();
});

it("should not render umbraco blocks inside `<p>` tags", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        blocks: [{ content: { id: "1", properties: {} } }],
        elements: [
          {
            tag: "p",
            attributes: {},
            elements: [
              {
                tag: "umb-rte-block",
                attributes: { "content-id": "1" },
                elements: [],
              },
            ],
          },
          {
            tag: "p",
            attributes: {},
            elements: [
              {
                tag: "umb-rte-block-inline",
                attributes: { "content-id": "1" },
                elements: [],
              },
            ],
          },
          {
            tag: "p",
            attributes: {},
            elements: [
              { tag: "#text", text: "This is a paragraph with text." },
              {
                tag: "umb-rte-block",
                attributes: { "content-id": "1" },
                elements: [],
              },
            ],
          },
        ],
      }}
      renderBlock={(block) => (
        <div data-testid="umb-rte-block">{block?.content?.id}</div>
      )}
    />,
  );
  expect(screen.container.innerHTML).toMatchSnapshot();
});

it("should handle default attributes for elements", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "h1",
            attributes: {},
            elements: [
              {
                text: "Welcome",
                tag: "#text",
              },
            ],
          },
          {
            tag: "p",
            attributes: {},
            elements: [
              {
                text: "What follows from here is just a bunch of absolute nonsense I've written to dogfood the plugin itself.",
                tag: "#text",
              },
            ],
          },
          {
            tag: "h2",
            attributes: { class: "pre-styled" },
            elements: [
              {
                text: "h2 is already styled",
                tag: "#text",
              },
            ],
          },
        ],
      }}
      htmlAttributes={{
        p: { className: "mb-4" },
        h1: { className: "text-2xl", style: { color: "red" } },
        h2: { className: "text-1xl" },
      }}
    />,
  );

  const [h1, h2] = screen
    .getByRole("heading")
    .all()
    .map((heading) => heading.element());
  expect(h1).toHaveClass("text-2xl");
  expect(h1).toHaveAttribute("style", "color: red;");
  expect(h2).toHaveClass("text-1xl"); //
  expect(h2).toHaveClass("pre-styled"); // `h2` has a class by default. It should be preserved

  const paragraph = screen.getByRole("paragraph");
  expect(paragraph.element()).toHaveClass("mb-4");
});

it("should handle default attributes for with renderNode", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "p",
            attributes: {},
            elements: [
              {
                text: "What follows from here is just a bunch of absolute nonsense I've written to dogfood the plugin itself.",
                tag: "#text",
              },
            ],
          },
        ],
      }}
      htmlAttributes={{
        p: { className: "mb-4" },
        h1: { className: "text-2xl", style: { color: "red" } },
        h2: { className: "text-1xl" },
      }}
      renderNode={(node) => {
        if (node.tag === "p") {
          return (
            <p
              {...node.attributes}
              className={[node.attributes.className, "font-medium"]
                .filter(Boolean)
                .join(" ")}
            >
              {node.children}
            </p>
          );
        }
      }}
    />,
  );

  const paragraph = screen.getByRole("paragraph").element();
  expect(paragraph).toHaveClass("mb-4");
  expect(paragraph).toHaveClass("mb-4 font-medium");
});

it("should decode HTML entities in anchor href", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "a",
            attributes: {
              href: "https://www.dropbox.com/scl/fo/nxzsi3mhxcw1h328ec8sj/ADYSbOqtvqfrXGm4ahvux0Y?rlkey=mq5r35jkliuaax978dax&amp;st=kf3qsjg5&amp;dl=0",
              anchor: "?rlkey=mq5r35jkliuaax978dax&amp;st=kf3qsjg5&amp;dl=0",
            },
            elements: [
              {
                text: "Decoded link",
                tag: "#text",
              },
            ],
          },
        ],
      }}
    />,
  );
  const link = screen.getByRole("link").element() as HTMLAnchorElement;
  expect(link.href).toBe(
    "https://www.dropbox.com/scl/fo/nxzsi3mhxcw1h328ec8sj/ADYSbOqtvqfrXGm4ahvux0Y?rlkey=mq5r35jkliuaax978dax&st=kf3qsjg5&dl=0",
  );
});

it("should handle anchor with hash", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "a",
            attributes: {
              href: "https://www.charlietango.dk/",
              anchor: "#main",
            },
            elements: [
              {
                text: "Link",
                tag: "#text",
              },
            ],
          },
        ],
      }}
    />,
  );

  const link = screen.getByRole("link").element() as HTMLAnchorElement;
  expect(link.href).toBe("https://www.charlietango.dk/#main");
});

it("should handle anchor with hash and query params", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "a",
            attributes: {
              href: "https://www.charlietango.dk/?query=param",
              anchor: "#main",
            },
            elements: [
              {
                text: "Link",
                tag: "#text",
              },
            ],
          },
        ],
      }}
    />,
  );

  const link = screen.getByRole("link").element() as HTMLAnchorElement;
  expect(link.href).toBe("https://www.charlietango.dk/?query=param#main");
});

it("should anchor to route paths", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "a",
            attributes: {
              anchor: "#main",
              route: { path: "/about" },
            },
            elements: [
              {
                text: "Link",
                tag: "#text",
              },
            ],
          },
        ],
      }}
    />,
  );

  const link = screen.getByRole("link").element();
  expect(link).toHaveAttribute("href", "/about#main");
  expect(link).not.toHaveAttribute("anchor");
});

it("don't remove localhost, from an URL that for some weird reason also contains localhost as part of it", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "a",
            attributes: {
              anchor: "?url=http://localhost/",
              href: "http://localhost:3000/about",
            },
            elements: [
              {
                text: "Link",
                tag: "#text",
              },
            ],
          },
        ],
      }}
    />,
  );

  const link = screen.getByRole("link").element();
  expect(link).toHaveAttribute(
    "href",
    "http://localhost:3000/about?url=http%3A%2F%2Flocalhost%2F",
  );
});

it("should forward the expected meta data nodes to renderNode", () => {
  // Create a mock function to capture renderNode calls
  const renderNodeMock = vi.fn((_node) => {
    // Return undefined to use default rendering
    return undefined;
  });

  render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "div",
            attributes: { id: "parent" },
            elements: [
              {
                tag: "p",
                attributes: { id: "first-child" },
                elements: [{ tag: "#text", text: "First child" }],
              },
              {
                tag: "p",
                attributes: { id: "middle-child" },
                elements: [{ tag: "#text", text: "Middle child" }],
              },
              {
                tag: "p",
                attributes: { id: "last-child" },
                elements: [{ tag: "#text", text: "Last child" }],
              },
            ],
          },
        ],
      }}
      renderNode={renderNodeMock}
    />,
  );

  // Find the call for the middle paragraph
  const middleChildCall = renderNodeMock.mock.calls.find(
    (call) => call[0].attributes.id === "middle-child",
  )?.[0];

  expect(middleChildCall).toBeDefined();

  // Check that the meta property contains the expected values
  expect(middleChildCall.meta).toBeDefined();

  // Check parent (ancestor)
  expect(middleChildCall.meta.ancestor).toBeDefined();
  expect(middleChildCall.meta.ancestor?.tag).toBe("div");
  expect(middleChildCall.meta.ancestor?.attributes.id).toBe("parent");

  // Check previous sibling
  expect(middleChildCall.meta.previous).toBeDefined();
  expect(middleChildCall.meta.previous?.tag).toBe("p");
  expect(middleChildCall.meta.previous?.attributes.id).toBe("first-child");

  // Check next sibling
  expect(middleChildCall.meta.next).toBeDefined();
  expect(middleChildCall.meta.next?.tag).toBe("p");
  expect(middleChildCall.meta.next?.attributes.id).toBe("last-child");

  // Check that children is the text node
  expect(middleChildCall.meta.children).toMatchObject([
    {
      tag: "#text",
      text: "Middle child",
    },
  ]);
});

it("should convert colspan and rowspan to colSpan and rowSpan in table rendering", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "table",
            elements: [
              {
                tag: "tr",
                elements: [
                  {
                    tag: "td",
                    attributes: { colspan: "2", "data-testid": "cell1" },
                    elements: [{ tag: "#text", text: "Cell 1" }],
                  },
                  {
                    tag: "td",
                    attributes: { rowspan: "2", "data-testid": "cell2" },
                    elements: [{ tag: "#text", text: "Cell 2" }],
                  },
                ],
              },
            ],
          },
        ],
      }}
    />,
  );

  expect(screen.getByTestId("cell1").element()).toHaveAttribute("colSpan", "2");
  expect(screen.getByTestId("cell2").element()).toHaveAttribute("rowSpan", "2");
});

it("should strip all inline styles when stripStyles is true", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "div",
            attributes: { style: "color: red; font-size: 16px;" },
            elements: [
              {
                tag: "p",
                attributes: { style: "margin: 10px; padding: 5px;" },
                elements: [{ tag: "#text", text: "Text with stripped styles" }],
              },
            ],
          },
        ],
      }}
      stripStyles={true}
    />,
  );

  const div = screen.container.querySelector("div");
  const p = screen.container.querySelector("p");

  expect(div).not.toHaveAttribute("style");
  expect(p).not.toHaveAttribute("style");
});

it("should strip styles only from specified tags", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "div",
            attributes: { style: "color: red; font-size: 16px;" },
            elements: [
              {
                tag: "p",
                attributes: { style: "margin: 10px; padding: 5px;" },
                elements: [
                  { tag: "#text", text: "Text with partially stripped styles" },
                ],
              },
            ],
          },
        ],
      }}
      stripStyles={{ tags: ["p"] }}
    />,
  );

  const div = screen.container.querySelector("div");
  const p = screen.container.querySelector("p");

  expect(div).toHaveAttribute("style", "color: red; font-size: 16px;");
  expect(p).not.toHaveAttribute("style");
});

it("should preserve styles for excepted tags", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "div",
            attributes: { style: "color: red; font-size: 16px;" },
            elements: [
              {
                tag: "p",
                attributes: { style: "margin: 10px; padding: 5px;" },
                elements: [{ tag: "#text", text: "Text with excepted styles" }],
              },
              {
                tag: "span",
                attributes: { style: "font-weight: bold;" },
                elements: [{ tag: "#text", text: "Bold text" }],
              },
            ],
          },
        ],
      }}
      stripStyles={{ except: ["p"] }}
    />,
  );

  const div = screen.container.querySelector("div");
  const p = screen.container.querySelector("p");
  const span = screen.container.querySelector("span");

  expect(div).not.toHaveAttribute("style");
  expect(p).toHaveAttribute("style", "margin: 10px; padding: 5px;");
  expect(span).not.toHaveAttribute("style");
});

it("should combine tags and except properties correctly", () => {
  const screen = render(
    <UmbracoRichText
      data={{
        tag: "#root",
        elements: [
          {
            tag: "div",
            attributes: { style: "color: red;" },
            elements: [
              {
                tag: "p",
                attributes: { style: "margin: 10px;" },
                elements: [{ tag: "#text", text: "Paragraph" }],
              },
              {
                tag: "span",
                attributes: { style: "font-weight: bold;" },
                elements: [{ tag: "#text", text: "Span" }],
              },
              {
                tag: "h1",
                attributes: { style: "font-size: 24px;" },
                elements: [{ tag: "#text", text: "Heading" }],
              },
            ],
          },
        ],
      }}
      stripStyles={{ tags: ["div", "p", "span"], except: ["span"] }}
    />,
  );

  const div = screen.container.querySelector("div");
  const p = screen.container.querySelector("p");
  const span = screen.container.querySelector("span");
  const h1 = screen.container.querySelector("h1");

  expect(div).not.toHaveAttribute("style");
  expect(p).not.toHaveAttribute("style");
  expect(span).toHaveAttribute("style", "font-weight: bold;");
  expect(h1).toHaveAttribute("style", "font-size: 24px;");
});
