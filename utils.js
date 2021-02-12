export class StructuredCloneHash {
 // Allow easier extraction from the structured clone binary format used in
 // browsers' session storage files, for the benefit of session recovery scripts.
 // Any actual null bytes in the data contained in `hash` should be escaped,
 // e.g. with `encodeURIComponent()`.
 // 
 // Example: <https://code.s.zeid.me/bin/blob/master/sessionstore2html>
 // (search for "note_tab_magic")
 
 static decode(hash, uuid) {
  if (uuid && !hash.startsWith("urn:uuid:" + uuid))
   throw new RangeError("UUIDs do not match");
  if (!hash.includes("#"))
   throw new RangeError("encoded hash must contain a `#`");
  
  let start = hash.indexOf("#");
  let end = hash.indexOf("\0");
  return hash.substring(start, end >= 0 ? end : hash.length);
 }
 
 static encode(hash, uuid) {
  if (!hash.startsWith("#"))
   throw new RangeError("hash must start with `#`");
  return "urn:uuid:" + uuid + hash + "\0";
 }
}


export function autoResizeInput(el) {
 function listener() {
  let isEmpty = !el.value.length;
  if (isEmpty && el.placeholder)
   el.value = el.placeholder;
  
  el.style.width = "0px";
  
  let width = el.scrollWidth + window.devicePixelRatio;
  el.style.width = `${width}px`;
  
  if (isEmpty)
   el.value = "";
 }
 
 el.addEventListener("input", listener);
 el.addEventListener("x-autoresize-update", listener);
 window.addEventListener("resize", listener);
 listener();
}


export function autoResizeTextarea(el) {
 if (!el.style.minHeight) {
  el.style.setProperty("--computed-line-height", window.getComputedStyle(el).lineHeight);
  el.style.minHeight = "calc(var(--computed-line-height) * 3 + 1px)";
 }
 
 function listener() {
  el.style.height = "auto";
  
  let height = el.scrollHeight + window.devicePixelRatio;
  el.style.height = `${height}px`;
 }
 
 el.addEventListener("input", listener);
 el.addEventListener("x-autoresize-update", listener);
 window.addEventListener("resize", listener);
 listener();
}


export function formatFromAttribute(el, attr, replaceFunction) {
 let dataAttr = attr + "Format";
 if (!el.dataset[dataAttr])
  el.dataset[dataAttr] = el.getAttribute(attr);
 
 let format = el.dataset[dataAttr];
 
 let result = format;
 if (replaceFunction) {
  result = replaceFunction(format);
  el.setAttribute(attr, result);
 }
 return result;
}


export function renderEmoji(emoji, shadowColor, size) {
 emoji = (typeof emoji === "string") ? emoji.trim() : "";
 shadowColor = (typeof shadowColor === "string") ? shadowColor : null;
 size = (typeof size === "number" && size > 0) ? size : 64;
 
 const EMOJI_VARIATION_SELECTOR = "\uFE0F";
 
 const canvas = document.createElement("canvas");
 canvas.width = canvas.height = size;
 
 const ctx = canvas.getContext("2d");
 ctx.font = `${size * 0.875}px sans-serif`;
 ctx.textAlign = "center";
 ctx.textBaseline = "bottom";
 if (shadowColor) {
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 1 * size / 16;
 }
 for (let i = 0; i < (shadowColor ? 2 : 1); i++) {
  ctx.fillText(emoji + EMOJI_VARIATION_SELECTOR, size / 2, size);
 }
 
 return canvas.toDataURL("image/png");
}


export function setEmojiFavicon(emoji, shadowColor, size) {
 shadowColor = (typeof shadowColor === "string") ? shadowColor : null;
 size = (typeof size === "number" && size > 0) ? size : 64;
 
 if (emoji && emoji.length) {
  const newLink = document.createElement("link");
  newLink.rel = "icon";
  newLink.href = renderEmoji(emoji, shadowColor, size);
  for (const oldLink of document.querySelectorAll("link[rel='icon']")) {
   oldLink.remove();
  }
  document.head.appendChild(newLink);
 }
}


export function setEmojiFaviconFromAttribute(element, attributeName, size, forceShadowColor) {
 attributeName = (typeof attributeName === "string" && attributeName)
                 ? attributeName : "data-emoji-favicon";
 size = (typeof size === "number" && size > 0) ? size : 64;
 forceShadowColor = (typeof forceShadowColor === "string") ? forceShadowColor : null;
 
 function parse(emoji, forceShadowColor) {
  emoji = (typeof emoji === "string") ? emoji.trim() : "";
  forceShadowColor = (typeof forceShadowColor === "string") ? forceShadowColor : null;
  
  let shadowColor = forceShadowColor;
  const emojiShadowColorSplitIndex = emoji.search(/[ #0-9a-zA-Z]/);
  if (emojiShadowColorSplitIndex > -1) {
   if (!shadowColor) {
    shadowColor = emoji.substring(emojiShadowColorSplitIndex).trim();
   }
   emoji = emoji.substring(0, emojiShadowColorSplitIndex).trim();
  }
  return [emoji, shadowColor];
 }
 
 if (!element.hasAttribute(attributeName)) {
  element.setAttribute(attributeName, "");
 }
 
 const parsed = parse(element.getAttribute(attributeName), forceShadowColor);
 setEmojiFavicon.apply(null, parsed.concat([size]));
 
 const emojiFaviconObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
   if (mutation.attributeName === attributeName) {
    const parsed = parse(element.getAttribute(attributeName), forceShadowColor);
    setEmojiFavicon.apply(null, parsed.concat([size]));
   }
  }
 });
 emojiFaviconObserver.observe(element, { attributes: true });
 
 return emojiFaviconObserver;
}
