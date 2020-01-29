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
 listener();
}


export function autoResizeTextarea(el, maxHeightPixels) {
 let maxHeight = maxHeightPixels;
 if (!maxHeight) {
  maxHeight = window.getComputedStyle(el).maxHeight;
  if (maxHeight.match(/^[0-9]+px$/))
   maxHeight = Number(maxHeight.replace(/[^0-9]/g, ""));
  else
   maxHeight = null;
 }
 
 if (!el.style.minHeight) {
  el.style.setProperty("--computed-line-height", window.getComputedStyle(el).lineHeight);
  el.style.minHeight = "calc(var(--computed-line-height) * 3 + 1px)";
 }
 
 function listener() {
  el.style.height = "auto";
  
  let height = Math.min(el.scrollHeight + window.devicePixelRatio, maxHeight || Infinity);
  el.style.height = `${height}px`;
  el.style.overflowY = (height >= maxHeight) ? "auto" : "hidden";
 }
 
 el.addEventListener("input", listener);
 el.addEventListener("x-autoresize-update", listener);
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
