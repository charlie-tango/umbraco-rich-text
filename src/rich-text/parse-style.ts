import type { CSSProperties } from "react";

/**
 * Convert a kebab-case string to camelCase.
 * @param value
 */
const toCamelCase = (value: string) => {
  return value.replace(/-([a-z])/g, (g) => {
    return g[1]?.toUpperCase() ?? "";
  });
};

/**
 * Parse a style string into a CSSProperties object.
 * This is a basic conversion, that does not do any validation of the style properties.
 * @param style
 */
const MAX_STYLE_CACHE_ENTRIES = 200;
const styleCache = new Map<string, CSSProperties>();

export const parseStyle = (style: string) => {
  const normalizedStyle = style.trim();
  if (!normalizedStyle) {
    // Return an empty object if no style string is provided
    return {} as CSSProperties;
  }

  const cached = styleCache.get(normalizedStyle);
  if (cached) return cached;

  const styleProps: Record<string, string> = {};

  const styleElements = normalizedStyle.split(";");
  for (const el of styleElements) {
    let [property, value] = el.split(":");
    if (!property || value === undefined) continue;
    property = property.trim();
    if (!property.startsWith("--")) {
      // Convert kebab-case to camelCase for CSS properties
      property = toCamelCase(property);
    }
    styleProps[property] = value.trim();
  }

  const parsed = styleProps as CSSProperties;

  // Maintain a bounded cache to avoid unbounded memory growth
  if (styleCache.size >= MAX_STYLE_CACHE_ENTRIES) {
    const firstKey = styleCache.keys().next().value;
    if (firstKey !== undefined) {
      styleCache.delete(firstKey);
    }
  }
  styleCache.set(normalizedStyle, parsed);

  return parsed;
};
