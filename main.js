import EmojiFavicon from "./emoji-favicon.js";
import * as TextInput from "./textinput.js";
import * as Utils from "./utils.js";


class App {
  get MAGIC() { return "46e56985-cff3-45fd-b1b7-c5f84fbb921c"; }

  get EXTENSION_INFO() { return {
    ".md": {
      mime: "text/markdown",
      name: "Markdown",
    },
    ".txt": {
      mime: "text/plain",
    },
    ".asc": {
      mime: "text/x-ascii",
      name: "plain-text",
      types: {
        art: {
          name: "ASCII",
          verbosePlaceholder: true,
        },
      },
    },
    ".ascii": ".asc",
    get(extension) {
      while (
        extension?.startsWith(".") &&
        typeof(this[extension]) == "string" &&
        extension != this[extension]
      ) {
        extension = this[extension];
      }
      return this[extension];
    },
  }; }
  get DEFAULT_EXTENSION() { return ".md"; }
  get DEFAULT_TYPE_NAME() { return "note"; }

  constructor(container) {
    this.els = {
      container: container,
      main: container,
      type: {
        field: container.querySelector("#type"),
      },
      title: {
        field: container.querySelector("#title > input"),
        print: container.querySelector("#title > pre"),
      },
      body: {
        field: container.querySelector("#body > note-tab-textinput"),
        print: container.querySelector("#body > pre"),
      },
      link: container.querySelector("#link"),
      download: container.querySelector("#download"),
      open: container.querySelector("#open"),
      new_: container.querySelector("#new"),
      file: container.querySelector("#file"),
    };

    this.state = {
      loaded: false,
      saved: false,
    };

    this.baseURI = null;
    this.debug = false;
    this.initialTitle = null;
  }

  get type() {
    return this.els.type.field.value;
  }
  set type(value) {
    this.els.type.field.value = value;
    const monospace = [".asc", ".ascii"].includes(this.typeExtension);
    this.els.main.classList.toggle("monospace", monospace);
    const highlight = !monospace;
    this.els.main.classList.toggle("no-highlight", !highlight);
    this.markupChiselAdapter?.markupChisel.toggles.highlightMarkup.set(highlight);
  }

  get typeName() {
    return this.type.replace(/\.[^.]*$/, "");
  }

  get typeExtension() {
    return this.type.match(/\.[^.]*$/)?.[0] || "";
  }

  get typeExtensionName() {
    const extInfo = this.EXTENSION_INFO.get(this.typeExtension);
    return extInfo?.types?.[this.typeName]?.name || extInfo?.name || "";
  }

  async load() {
    let historyState = window.history.state || {
      hash: window.location.hash,
      saved: true,
    };
    this.state.saved = historyState.saved;

    let hash = Utils.StructuredCloneHash.decode(historyState.hash || "#");
    if (hash == "#test") {
      const testParams = new URLSearchParams();
      testParams.set("type", `${this.DEFAULT_TYPE_NAME}${this.DEFAULT_EXTENSION}`);
      testParams.set("title", "note test");
      testParams.set("body", (await import("./lib/test-document.js")).default);
      hash = this.makeHash(testParams);
      this.replaceState(hash, true);
    }
    let params = new URLSearchParams(hash.substring(1));

    let type = params.get("type") || this.els.type.field.dataset["default"];
    if (type.startsWith(".")) {
      type = this.els.type.field.dataset["default"].replace(/\.[a-z0-9]+$/i, "") + type;
    }
    if (!type.replace(/\.+$/, "").includes(".")) {
      type = type.replace(/\.+$/, "") + this.DEFAULT_EXTENSION;
    }
    if (type != params.get("type")) {
      type = type;
      params.set("type", type);
      hash = this.makeHash(params);
      this.replaceState(hash, true);
    }
    this.type = type;
    const typeName = this.typeName;
    Utils.formatFromAttribute(this.els.new_, "href", f => {
      f = f.replace("{0}", this.baseURI);
      f = f.replace("{1}", type);
      return f;
    });
    const verboseTypeName = `${this.typeExtensionName} ${typeName}`.trim();
    Utils.formatFromAttribute(this.els.new_, "title", f => {
      return f.replace("{0}", verboseTypeName);
    });
    Utils.formatFromAttribute(this.els.title.field, "placeholder", f => {
      return f.replace(
        "{0}",
        this.EXTENSION_INFO.get(this.typeExtension)?.types?.[this.typeName]?.verbosePlaceholder
          ? verboseTypeName : typeName,
      );
    });

    this.els.title.field.value = params.get("title") || "";
    this.els.title.field.dispatchEvent(new CustomEvent("x-autoresize-update"));

    this.els.body.field.value = params.get("body") || "";

    this.update(false);

    if (!window.history.state) {
      this.save(false);
    }

    this.state.loaded = true;
  }

  update(doState) {
    if (typeof doState === "undefined") {
      doState = true;
    }

    if (doState) {
      this.state.saved = false;
    }

    let hash = this.makeHash();
    this.els.link.href = hash;
    this.setDocumentTitle();
    this.setEmojiFavicon();

    if (doState) {
      this.replaceState(hash);
    }
  }

  setDocumentTitle() {
    let title = this.els.title.field.value || this.els.title.field.placeholder;
    const emoji = this.getLeadingOrTrailingEmoji(title);
    if (emoji) {
      if (title.startsWith(emoji)) {
        title = title.substring(emoji.length).trimStart();
      } else if (title.endsWith(emoji)) {
        title = title.substring(0, title.length - emoji.length).trimEnd();
      }
    }
    if (this.state.saved === false) {
      title = "* " + title;
    }
    if (emoji && Utils.getFirefoxAndroidVersion() < Infinity) {
      title = `${emoji}\u00a0\u00a0${title}`;
    }
    if (document.title != title) {
      document.title = title;
    }
  }

  setEmojiFavicon() {
    if (Utils.getFirefoxAndroidVersion() < Infinity) {
      return;
    }
    const title = this.els.title.field.value || this.els.title.field.placeholder;
    const emoji = this.getLeadingOrTrailingEmoji(title);
    if (
      emoji &&
      !document.documentElement.dataset.emojiFavicon.startsWith(`${emoji} `)
    ) {
      const params = this.initialEmojiFavicon.split(" ", 2);
      document.documentElement.dataset.emojiFavicon = `${emoji} ${params[1]}`;
    } else if (!emoji) {
      document.documentElement.dataset.emojiFavicon = this.initialEmojiFavicon;
    }
  }

  getLeadingOrTrailingEmoji(s) {
    if (Utils.isRGIEmojiPropertySupported()) {
      const regionalIndicators = "(?:[\u{1F1E6}-\u{1F1FF}]|\uD83C[\uDDE6-\uDDFF])";
      const allowedChars = `(?:\\p{RGI_Emoji}|${regionalIndicators}{1,2})`;
      const leadingOrTrailing = `(?:^${allowedChars}|${allowedChars}$)`;
      return new RegExp(`(${leadingOrTrailing})`, "v").exec(s)?.[1];
    };
  }

  save(saveHash) {
    if (typeof saveHash === "undefined") {
      saveHash = true;
    }

    this.state.saved = true;
    this.setDocumentTitle();
    this.replaceState(null, saveHash);
  }

  async open(dialog = true) {
    if (dialog) {
      this.els.file.value = "";
      this.els.file.showPicker();
      return;
    }

    if (this.els.file.files.length) {
      let file = this.els.file.files[0];
      let contents = await file.text();
      this.els.file.value = "";
      this.state.saved = false;

      // Use the type from the filename (of the format `<title>.<type>.txt`)
      // if the filename matches the rules listed in <README.md#file-format>.
      const typeRegExp = /[^.]\.([a-zA-Z ]|[^\u0000-\u007f])+( \([0-9]+\)|-[0-9]+)?\.[a-z0-9]+$/i;
      let type = this.els.type.field.dataset["default"];
      let typeName = "", typeExtension = "";
      if (file.name.match(typeRegExp)) {
        let typeParts = file.name.split(".");
        let typeCandidate = typeParts[typeParts.length - 2];
        if (!typeCandidate.startsWith(" ")) {
          typeName = typeCandidate.replace(/( \([0-9]+\)|-[0-9]+)$/, "");
        }
        typeExtension = "." + typeParts[typeParts.length - 1].toLowerCase();
      } else if (file.name.match(/\.[a-z0-9]+$/i)) {
        let filenameParts = file.name.split(".");
        typeExtension = "." + filenameParts[filenameParts.length - 1].toLowerCase();
      }
      if (!this.EXTENSION_INFO.get(typeExtension)) {
        typeExtension = "";
      }
      if (typeName) {
        type = typeName + typeExtension;
      } else if (typeExtension) {
        type = type.replace(/\.[^.]+$/, "") + typeExtension;
      }

      const titleRegExp = /^[^\n]*\r?\n=+\r?\n(\r?\n)?/m;
      let title = "";
      let body = "";
      if (contents.search(titleRegExp) === 0) {
        title = contents.split(/\r?\n/m, 1);
        body = contents.replace(titleRegExp, "");
      } else {
        body = contents;
      }
      if (body.substring(body.length - 2) === "\r\n") {
        body = body.substring(0, body.length - 2);
      } else if (body.substring(body.length - 1) === "\n") {
        body = body.substring(0, body.length - 1);
      }

      this.type = type;
      this.els.title.field.value = title;
      this.els.body.field.value = body;
      this.save();
      await this.load();
    }
  }

  download() {
    let title = "";
    let titleContents = "";
    if (this.els.title.field.value) {
      title = this.els.title.field.value;
      let separator = title;
      if (Utils.isRGIEmojiPropertySupported()) {
        separator = separator.replace(new RegExp("\\s*\\p{RGI_Emoji}$", "v"), "");
        separator = separator.replace(new RegExp("\\p{RGI_Emoji}", "vg"), "==");
      }
      separator = "=".repeat(Math.min(separator.length, 76));
      titleContents = `${title}\n${separator}\n\n`;
    } else {
      title = this.els.title.field.placeholder;
    }
    const contents = `${titleContents}${this.els.body.field.value}\n`;
    const mime = this.EXTENSION_INFO.get(this.typeExtension)?.mime || "text/plain";

    const url = URL.createObjectURL(new Blob(
      [contents], {type: `${mime}; charset=utf-8`}
    ));

    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.${this.type}`.replace("/", "\u2044");
    a.style.display = "none";
    this.els.download.parentElement.insertBefore(a, this.els.download);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  makeHash(searchParams) {
    let keys = ["type", "title", "body"];
    let params = [];
    for (let key of keys) {
      let value;
      if (searchParams?.get(key)) {
        value = searchParams.get(key);
      } else {
        value = this.els[key].field.value;
      }
      if (value) {
        params.push(
          encodeURIComponent(key) +
          "=" +
          encodeURIComponent(value),
        );
      }
    }
    return "#" + params.join("&");
  }

  replaceState(hash, saveHash) {
    let stateHash = hash || this.makeHash();
    let state = {
      hash: Utils.StructuredCloneHash.encode(stateHash, this.MAGIC),
      saved: this.state.saved,
    };
    let url = undefined;
    if (saveHash) {
      url = this.baseURI + stateHash;
    }
    window.history.replaceState(state, document.title, url);
  }

  updateOnInput(e) {
    if (e.isComposing) {
      return;
    }
    this.update();
  }

  onKeyDown(event) {
    const mod = event.ctrlKey || event.metaKey;
    const modOnly = mod && !event.shiftKey && !event.altKey;
    const isTitle = event.target === this.els.title.field;
    if ((mod || isTitle) && event.code.match(/^(Numpad)?(Enter|Return)$/)) {
      return this.save();
    } else if (modOnly && event.code.match(/^KeyO$/)) {
      event.preventDefault();
      return this.open();
    } else if (modOnly && event.code.match(/^KeyS$/)) {
      event.preventDefault();
      return this.download();
    } else if (modOnly && event.code.match(/^KeyN$/)) {
      event.preventDefault();
      return this.els.new.click();
    }
  }

  async main() {
    this.baseURI = window.location.href.replace(/#.*$/, "");
    this.initialTitle = document.title;
    this.initialEmojiFavicon = document.documentElement.dataset.emojiFavicon;
    this.setEmojiFavicon();

    Utils.formatFromAttribute(this.els.type.field, "data-default", f => {
      f = f.replace("{0}", this.DEFAULT_TYPE_NAME);
      f = f.replace("{1}", this.DEFAULT_EXTENSION);
      return f;
    });

    await this.load();

    window.addEventListener("beforeprint", e => {
      const title = this.els.title, body = this.els.body;
      title.print.textContent = title.field.value || title.field.placeholder;
      body.print.textContent = body.field.value || body.field.placeholder;
    });
    window.addEventListener("afterprint", e => {
      if (!this.debug) {
        const title = this.els.title, body = this.els.body;
        title.print.textContent = body.print.textContent = "";
      }
    });

    window.addEventListener("hashchange", async (event) => {
      window.history.replaceState(null, "");
      await this.load();
    });

    for (const button of [this.els.link, this.els.download, this.els.open]) {
      Utils.formatPlatformWordsFromAttribute(button, "title", f => {
        const ua = navigator.userAgent;
        f = f.replaceAll("{openKey}", ua.includes("Firefox") ? "" : " ({modifier}-O)");
        f = Utils.formatPlatformWords(f);
        return f;
      });
    }

    this.els.title.field.addEventListener("input", e => this.updateOnInput(e));
    this.els.body.field.addEventListener("input", e => this.updateOnInput(e));
    document.documentElement.addEventListener("keydown", e => this.onKeyDown(e));

    this.els.link.addEventListener("click", e => {
      if (!(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
      }
      this.save();
    });

    this.els.download.addEventListener("click", () => this.download());

    this.els.file.value = "";
    this.els.file.addEventListener("change", () => this.open(false));
    this.els.open.addEventListener("click", () => this.els.file.click());

    this.els.container.style.display = null;
    if (!this.els.container.style.cssText) {
      this.els.container.removeAttribute("style");
    }

    Utils.autoResizeInput(this.els.title.field);

    if (!this.els.title.field.value && !this.els.body.field.value) {
      this.save();
      this.els.title.field.focus();
    }

    this.textInput = this.els.body.field;
    this.textAreaAdapter = this.textInput.adapter;
    setTimeout(async () => {
      const module = await import("./markupchisel-adapter.js");
      this.markupChiselAdapter = new module.MarkupChiselAdapter(this.els.body.field);
      this.textInput.adapter = this.markupChiselAdapter;
      this.type = this.type;
      window.MarkupChisel = module.MarkupChisel;
      window.codemirror = module.imports.codemirror;
      window.lezer = module.imports.lezer;
    }, 0);
  }
}


window.TextInput = TextInput;
window.Utils = Utils;
window.app = new App(document.querySelector("main"));
if (document.readyState == "loading") {
  window.addEventListener("DOMContentLoaded", () => app.main());
} else {
  app.main();
}
