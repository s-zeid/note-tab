export class StructuredCloneHash {
  // Allow easier extraction from the structured clone binary format used in
  // browsers' session storage files, for the benefit of session recovery scripts.
  // Any actual null bytes in the data contained in `hash` should be escaped,
  // e.g. with `encodeURIComponent()`.
  // 
  // Example: <https://code.s.zeid.me/bin/blob/main/sessionstore2html>
  // (search for "note_tab_magic")

  static decode(hash, uuid) {
    if (uuid && !hash.startsWith("urn:uuid:" + uuid)) {
      throw new RangeError("UUIDs do not match");
    }
    if (!hash.includes("#")) {
      throw new RangeError("encoded hash must contain a `#`");
    }

    let start = hash.indexOf("#");
    let end = hash.indexOf("\0");
    return hash.substring(start, end >= 0 ? end : hash.length);
  }

  static encode(hash, uuid) {
    if (!hash.startsWith("#")) {
      throw new RangeError("hash must start with `#`");
    }
    return "urn:uuid:" + uuid + hash + "\0";
  }
}


export function autoResizeInput(el, styleEl, styleProp = "width") {
  function resolveStyleEl() {
    return ((typeof styleEl == "function") ? styleEl(el) : styleEl) || el;
  }

  function listener() {
    let isEmpty = !el.value.length;
    if (isEmpty && el.placeholder) {
      el.value = el.placeholder;
    }

    const styleElResult = resolveStyleEl();
    styleElResult.style.setProperty(styleProp, "0px");

    let width = el.scrollWidth + window.devicePixelRatio;
    styleElResult.style.setProperty(styleProp, `${width}px`);

    if (isEmpty) {
      el.value = "";
    }
  }

  el.addEventListener("input", listener);
  el.addEventListener("x-autoresize-update", listener);
  window.addEventListener("resize", listener);
  listener();
  return {
    listener,
    cleanup: () => {
      el.removeEventListener("input", listener);
      el.removeEventListener("x-autoresize-update", listener);
      window.removeEventListener("resize", listener);
      resolveStyleEl().style.removeProperty(styleProp);
    },
  };
}


export function autoResizeTextarea(el, styleEl, styleProp = "height") {
  function resolveStyleEl() {
    return ((typeof styleEl == "function") ? styleEl(el) : styleEl) || el;
  }

  function listener() {
    const styleElResult = resolveStyleEl();
    styleElResult.style.setProperty(styleProp, "auto");

    let height = el.scrollHeight + window.devicePixelRatio;
    styleElResult.style.setProperty(styleProp, `${height}px`);
  }

  el.addEventListener("input", listener);
  el.addEventListener("x-autoresize-update", listener);
  window.addEventListener("resize", listener);
  listener();
  return {
    listener,
    cleanup: () => {
      el.removeEventListener("input", listener);
      el.removeEventListener("x-autoresize-update", listener);
      window.removeEventListener("resize", listener);
      resolveStyleEl().style.removeProperty(styleProp);
    },
  };
}


export function formatFromAttribute(el, attr, replaceFunction) {
  let dataAttr = attr.replace(/-([a-z])/, (_, $1) => $1.toUpperCase()) + "Format";
  if (!el.dataset[dataAttr]) {
    el.dataset[dataAttr] = el.getAttribute(attr);
  }

  let format = el.dataset[dataAttr];

  let result = format;
  if (replaceFunction) {
    result = replaceFunction(format);
    el.setAttribute(attr, result);
  }
  return result;
}

export function setComputedLineHeight(el, styleEl) {
  function resolveStyleEl() {
    return ((typeof styleEl == "function") ? styleEl(el) : styleEl) || el;
  }

  resolveStyleEl().style.setProperty(
    "--computed-line-height",
    window.getComputedStyle(el).lineHeight,
  );
}
