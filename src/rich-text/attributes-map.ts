// A subset of HTML attributes that could be used in rich text rendering.
// We will get attributes in lowercase, so we need to map them to React's camelCase equivalents.
const attributesMap: Record<string, string> = {
  // Table-related attributes
  colspan: "colSpan",
  rowspan: "rowSpan",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",

  // Common HTML attributes
  class: "className", // React uses className instead of class
  tabindex: "tabIndex",
  for: "htmlFor", // The real HTML attribute on <label>
  inputmode: "inputMode",
  enterkeyhint: "enterKeyHint",
  autocapitalize: "autoCapitalize",
  popovertarget: "popoverTarget",
  popovertargetaction: "popoverTargetAction",

  // Form-related attributes
  accesskey: "accessKey",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  enctype: "encType",
  formaction: "formAction",
  formenctype: "formEncType",
  formmethod: "formMethod",
  formnovalidate: "formNoValidate",
  formtarget: "formTarget",
  hreflang: "hrefLang",
  htmlfor: "htmlFor",
  maxlength: "maxLength",
  minlength: "minLength",
  readonly: "readOnly",
  novalidate: "noValidate",
  dirname: "dirName",

  // Media-related attributes
  allowfullscreen: "allowFullScreen",
  allowpaymentrequest: "allowPaymentRequest",
  allowtransparency: "allowTransparency",
  frameborder: "frameBorder",
  marginheight: "marginHeight",
  marginwidth: "marginWidth",
  referrerpolicy: "referrerPolicy",
  srcdoc: "srcDoc",
  srcset: "srcSet",
  autoplay: "autoPlay",
  playsinline: "playsInline",
  controlslist: "controlsList",
  disablepictureinpicture: "disablePictureInPicture",
  disableremoteplayback: "disableRemotePlayback",
  usemap: "useMap",
  ismap: "isMap",
  fetchpriority: "fetchPriority",
  imagesizes: "imageSizes",
  imagesrcset: "imageSrcSet",

  // SVG-related attributes
  gradientunits: "gradientUnits",
  patternunits: "patternUnits",
  preserveaspectratio: "preserveAspectRatio",
  viewbox: "viewBox",

  // Microdata attributes
  itemid: "itemID",
  itemprop: "itemProp",
  itemref: "itemRef",
  itemscope: "itemScope",
  itemtype: "itemType",

  // Less common but potentially used in rich text
  acceptcharset: "acceptCharset",
  datetime: "dateTime",
  spellcheck: "spellCheck",
  nomodule: "noModule",
};

/**
 * Maps HTML attributes to their React equivalents.
 * This is useful for converting HTML attributes to React props when rendering rich text.
 */
export function mapHtmlAttributesToReact<T extends Record<string, unknown>>(
  attributes: T,
): T {
  if (!attributes || typeof attributes !== "object") {
    // Ensure attributes is a valid object, even if empty
    return {} as T;
  }
  const mappedAttributes: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attributes)) {
    const mappedKey = attributesMap[key.toLowerCase()];
    if (mappedKey) {
      mappedAttributes[mappedKey] = value;
    } else {
      mappedAttributes[key] = value;
    }
  }

  return mappedAttributes as T;
}
