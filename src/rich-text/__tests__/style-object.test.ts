import { parseStyle } from "../parse-style";

it("should return an empty object when no style string is provided", () => {
  const result = parseStyle("");
  expect(result).toEqual({});
});

it("should return an empty object when style string is only whitespace", () => {
  const result = parseStyle("   ");
  expect(result).toEqual({});
});

it("should return a style object for a valid style string", () => {
  const result = parseStyle("color: red; font-size: 16px; font-weight: bold;");
  expect(result).toEqual({
    color: "red",
    fontSize: "16px",
    fontWeight: "bold",
  });
});

it("should handle style properties with multiple words", () => {
  const result = parseStyle("background-color: red;");
  expect(result).toEqual({
    backgroundColor: "red",
  });
});

it("should not convert CSS variables into camelCase", () => {
  const result = parseStyle("--main-color: red;");
  expect(result).toEqual({ "--main-color": "red" });
});

it("should preserve style values that contain colons", () => {
  const result = parseStyle("background-image: url(https://example.com/x.png)");
  expect(result).toEqual({
    backgroundImage: "url(https://example.com/x.png)",
  });
});

it("should preserve colon-containing values alongside other declarations", () => {
  const result = parseStyle(
    "background: url(https://a/b.png) no-repeat; color: red",
  );
  expect(result).toEqual({
    background: "url(https://a/b.png) no-repeat",
    color: "red",
  });
});

it("should keep CSS variables in kebab-case with a colon-containing value", () => {
  const result = parseStyle("--brand: url(https://a/b.png)");
  expect(result).toEqual({ "--brand": "url(https://a/b.png)" });
});

it("should handle style values containing commas and parentheses", () => {
  const result = parseStyle("grid-template-columns: repeat(2, 1fr)");
  expect(result).toEqual({
    gridTemplateColumns: "repeat(2, 1fr)",
  });
});

it("should skip a declaration with an empty property", () => {
  const result = parseStyle(" : red");
  expect(result).toEqual({});
});
