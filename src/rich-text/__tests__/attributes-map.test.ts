import { mapHtmlAttributesToReact } from "../attributes-map";

it("should convert HTML attributes to React camelCase equivalents", () => {
  const htmlAttributes = {
    class: "header",
    tabindex: "0",
    colspan: "2",
    rowspan: "3",
    maxlength: "100",
    readonly: true,
    contenteditable: "true",
    autocomplete: "off",
    formnovalidate: true,
  };

  const reactAttributes = mapHtmlAttributesToReact(htmlAttributes);

  // Verify converted attributes
  expect(reactAttributes).toEqual({
    className: "header",
    tabIndex: "0",
    colSpan: "2",
    rowSpan: "3",
    maxLength: "100",
    readOnly: true,
    contentEditable: "true",
    autoComplete: "off",
    formNoValidate: true,
  });

  // Verify original attributes are not in the result
  expect(reactAttributes).not.toHaveProperty("class");
  expect(reactAttributes).not.toHaveProperty("tabindex");
  expect(reactAttributes).not.toHaveProperty("colspan");
  expect(reactAttributes).not.toHaveProperty("rowspan");
  expect(reactAttributes).not.toHaveProperty("maxlength");
  expect(reactAttributes).not.toHaveProperty("readonly");
  expect(reactAttributes).not.toHaveProperty("contenteditable");
  expect(reactAttributes).not.toHaveProperty("autocomplete");
  expect(reactAttributes).not.toHaveProperty("formnovalidate");
});

it("should keep unmapped attributes unchanged", () => {
  const mixedAttributes = {
    id: "test-id",
    class: "test-class",
    href: "/test-url",
    target: "_blank",
    "data-testid": "test-element",
  };

  const reactAttributes = mapHtmlAttributesToReact(mixedAttributes);

  // Verify only mapped attributes are converted
  expect(reactAttributes).toEqual({
    id: "test-id",
    className: "test-class",
    href: "/test-url",
    target: "_blank",
    "data-testid": "test-element",
  });

  // Original attribute should be gone
  expect(reactAttributes).not.toHaveProperty("class");
});

it("should handle empty or null attributes", () => {
  expect(mapHtmlAttributesToReact({})).toEqual({});
  // @ts-expect-error Testing null/undefined handling
  expect(mapHtmlAttributesToReact(null)).toEqual({});
  // @ts-expect-error Testing null/undefined handling
  expect(mapHtmlAttributesToReact(undefined)).toEqual({});
});

it("should convert SVG attributes", () => {
  const svgAttributes = {
    viewbox: "0 0 100 100",
    preserveaspectratio: "none",
    gradientunits: "userSpaceOnUse",
  };

  const reactAttributes = mapHtmlAttributesToReact(svgAttributes);

  expect(reactAttributes).toEqual({
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    gradientUnits: "userSpaceOnUse",
  });
});

it("should convert media-related attributes", () => {
  const mediaAttributes = {
    allowfullscreen: true,
    frameborder: "0",
    srcset: "image-1x.png 1x, image-2x.png 2x",
  };

  const reactAttributes = mapHtmlAttributesToReact(mediaAttributes);

  expect(reactAttributes).toEqual({
    allowFullScreen: true,
    frameBorder: "0",
    srcSet: "image-1x.png 1x, image-2x.png 2x",
  });
});

it("should handle attributes with mixed casing", () => {
  // Ensure we handle cases where attributes are not in standard lowercase
  const mixedCaseAttributes = {
    Class: "test-class", // Non-standard casing
    COLSPAN: "2", // Non-standard casing
    tabindex: "0", // Correct lowercase casing
  };

  // Our function should only map the correctly lowercase attributes
  const reactAttributes = mapHtmlAttributesToReact(mixedCaseAttributes);

  expect(reactAttributes).toEqual({
    className: "test-class", // Correctly mapped even with non-standard casing
    colSpan: "2", // Correctly mapped even with non-standard casing
    tabIndex: "0", // Correctly mapped
  });
});
