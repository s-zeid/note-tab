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
    styleElResult.style.setProperty(styleProp, "0");

    let width = el.scrollWidth + window.devicePixelRatio;
    styleElResult.style.setProperty(styleProp, `${width}px`);

    if (isEmpty) {
      el.value = "";
    }
  }

  el.addEventListener("input", listener);
  el.addEventListener("x-autoresize-update", listener);
  window.addEventListener("resize", listener);
  window.addEventListener("load", listener);
  listener();

  let loadingInterval = setInterval(listener, 50);
  function loadListener() {
    window.removeEventListener("load", listener);
    window.removeEventListener("load", loadListener);
    if (loadingInterval != null) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }
  window.addEventListener("load", loadListener);
  return {
    listener,
    cleanup: () => {
      el.removeEventListener("input", listener);
      el.removeEventListener("x-autoresize-update", listener);
      window.removeEventListener("resize", listener);
      window.removeEventListener("load", listener);
      window.removeEventListener("load", loadListener);
      resolveStyleEl().style.removeProperty(styleProp);
      if (loadingInterval != null) {
        clearInterval(loadingInterval);
        loadingInterval = null;
      }
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
  window.addEventListener("load", listener);
  listener();

  let loadingInterval = setInterval(listener, 50);
  function loadListener() {
    window.removeEventListener("load", listener);
    window.removeEventListener("load", loadListener);
    if (loadingInterval != null) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }
  window.addEventListener("load", loadListener);

  return {
    listener,
    cleanup: () => {
      el.removeEventListener("input", listener);
      el.removeEventListener("x-autoresize-update", listener);
      window.removeEventListener("resize", listener);
      window.removeEventListener("load", listener);
      window.removeEventListener("load", loadListener);
      resolveStyleEl().style.removeProperty(styleProp);
      if (loadingInterval != null) {
        clearInterval(loadingInterval);
        loadingInterval = null;
      }
    },
  };
}


export function formatFromAttribute(el, attr, replaceFunction) {
  const dataAttr = attr.replace(/-([a-z])/, (_, $1) => $1.toUpperCase()) + "Format";
  if (!el.dataset[dataAttr]) {
    el.dataset[dataAttr] = el.getAttribute(attr);
  }

  const format = el.dataset[dataAttr];

  let result = format;
  if (replaceFunction) {
    result = replaceFunction(format);
    el.setAttribute(attr, result);
  }
  return result;
}


export function formatPlatformWords(f, extraReplaceFunction) {
  const ua = navigator.userAgent;
  f = f.replaceAll("{modifier}", !ua.includes("Mac OS") ? "Ctrl" : "Command");
  f = f.replaceAll("{context}", !ua.match(/Mobile|Tablet/) ? "right-click" : "long press");
  f = extraReplaceFunction?.(f) ?? f;
  return f;
}


export function formatPlatformWordsFromAttribute(el, attr, extraReplaceFunction) {
  return formatFromAttribute(el, attr, f => formatPlatformWords(f, extraReplaceFunction));
}


export function getFirefoxAndroidVersion() {
  const ua = navigator.userAgent;
  if (ua.match(/Firefox/) && ua.match(/Android/)) {
    return Number(ua.match(/Firefox\/([0-9.]+)/)?.[1]) || Infinity;
  }
  return NaN;
}


export function isRGIEmojiPropertySupported() {
  try {
    return Boolean(new RegExp("^(\\p{RGI_Emoji})", "v").exec("🐱"));
  } catch (error) {
    return false;
  }
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
