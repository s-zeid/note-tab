import * as Utils from "./utils.js";


export { element as default };
export { element as NTTextInputElement };
const element = class NTTextInputElement extends HTMLElement {
  static NAME = "note-tab-textinput";

  static CSS = `
    :host(:where(:not([hidden]))) {
      display: block; position: relative; height: var(--base-height);
      overflow: auto; resize: auto;
      background: Field; color: FieldText; font: medium system-ui;
      --base-height: calc(var(--computed-line-height, 1.2) * var(--rows, -1) + 1px);
    }
    :host(:where([flex])) {
      min-height: var(--base-height);
      height: var(--flex-height, auto);
    }
    :host(:where(:not([hidden])):focus-within) {
      outline: 2px solid SelectedItem;
    }
    main, :host::part(input) {
      display: block; width: 100%; height: 100%; min-height: var(--base-height);
      margin: 0; padding: 0; border: none; resize: none;
      background: transparent; color: inherit; font: inherit; line-height: inherit;
    }
    main > *:focus {
      outline: none;
    }
    [part="placeholder"]:not([hidden]) {
      display: inline-block; position: absolute; z-index: -1; margin: 0; padding: 0;
      width: 100%; height: 100%; min-height: var(--base-height);
      border: none; font: inherit; pointer-events: none; resize: none;
    }
    [part="placeholder"]:not([hidden]), [part="placeholder"]::placeholder {
      color: inherit; opacity: 1;
    }
  `;

  static PRIVATE_CSS_PROPS = {
    "--rows": 2,
  };

  constructor() {
    super();
    this.privateStyleProps = this.#setupPrivateStyleProps();

    this.styleSheets = new Map();
    this.styleSheets.set("private", this.privateStyleProps.parentRule.parentStyleSheet),
    this.styleSheets.set("main", new this.ownerDocument.defaultView.CSSStyleSheet()),
    this.styleSheets.set("adapter", new this.ownerDocument.defaultView.CSSStyleSheet()),

    this.styleSheets.get("main").replaceSync(this.constructor.CSS);
    this.reorderStyleSheets();

    this.container = this.ownerDocument.createElement("main");
    this.container.part = "container";
    this.shadowRoot.replaceChildren(this.container);

    this.placeholderElement = this.ownerDocument.createElement("textarea");
    this.placeholderElement.part = "placeholder";
    this.placeholderElement.setAttribute("role", "presentation");
    this.placeholderElement.setAttribute("aria-hidden", "true");
    this.placeholderElement.readOnly = true;
    this.placeholderElement.tabIndex = -1;
    this.shadowRoot.prepend(this.placeholderElement);

    this.adapter = new TextAreaAdapter(this);
    const initialValue = this.innerHTML;
    if (initialValue) {
      this.adapter.value = initialValue;
    }

    this._inputListener = (event) => {
      this.updatePlaceholderVisibility();
    };
  }

  reorderStyleSheets() {
    for (const [name, styleSheet] of this.styleSheets.entries()) {
      styleSheet._name ??= name;
      while (this.shadowRoot.adoptedStyleSheets.includes(styleSheet)) {
        const i = this.shadowRoot.adoptedStyleSheets.indexOf(styleSheet);
        this.shadowRoot.adoptedStyleSheets.splice(i, 1);
      }
      this.shadowRoot.adoptedStyleSheets.push(styleSheet);
    }
  }

  connectedCallback() {
    Utils.setComputedLineHeight(this, { style: this.privateStyleProps });
    this.addEventListener("input", this._inputListener);
    this.adapter.connectedCallback();
  }

  disconnectedCallback() {
    this.adapter.disconnectedCallback();
    this.removeEventListener("input", this._inputListener);
  }

  static observedAttributes = "flex,placeholder,rows".split(",");

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      const nameCC = name.replace(/-([a-z])/gi, (_, $1) => $1.toUpperCase());
      this[nameCC] = newValue;
    }
  }

  get adapter() {
    return this.#adapter;
  }

  set adapter(value) {
    let focus = false;
    let selection = null;
    if (this.#adapter) {
      value.value = this.#adapter.value;
      value.clearHistory();
      focus = this.#adapter.focusElement === this.shadowRoot.activeElement;
      selection = this.getSelectedCharacterRange();
    }
    const oldAdapter = this.#adapter;
    this.#adapter = value;
    this.styleSheets.get("adapter").replaceSync(this.#adapter.constructor.CSS || "");
    this.container.replaceChildren(this.#adapter.element);
    this.adapter.element.part = "input";
    oldAdapter?.element.removeAttribute("part");
    oldAdapter?.disconnectedCallback();
    if (oldAdapter && this.parentElement) {
      this.adapter.connectedCallback();
    }
    if (selection) {
      const [start, end, direction] = selection;
      this.setSelectedCharacterRange(start, end, direction);
    }
    if (focus) {
      this.focus();
    }
  }

  get value() {
    return this.adapter.value;
  }

  set value(value) {
    this.updatePlaceholderVisibility(value);
    this.adapter.value = value;
  }

  get flex() {
    return this.hasAttribute("flex");
  }

  set flex(value) {
    this.toggleAttribute("flex", value != null);
  }

  get placeholder() {
    return this.placeholderElement.placeholder;
  }

  set placeholder(value) {
    this.placeholderElement.placeholder = value;
  }

  get rows() {
    return Number(this.privateStyleProps.getProperty("--rows"));
  }

  set rows(value) {
    let computed = value;
    if (value == null || value == "" || isNaN(value) || Math.abs(value) == Infinity) {
      computed = NaN;
    }
    computed = Number(computed);
    if (isNaN(computed)) {
      computed = this.constructor.PRIVATE_CSS_PROPS["--rows"];
    }
    this.privateStyleProps.setProperty("--rows", computed);
    if (value == null) {
      this.removeAttribute("rows");
    } else {
      this.setAttribute("rows", value);
    }
  }

  blur() {
    this.adapter.focusElement.blur();
  }

  focus() {
    this.adapter.focusElement.focus();
  }

  getSelectedCharacterRange() {
    return this.adapter.getSelectedCharacterRange();
  }

  setSelectedCharacterRange(start, end, direction, text) {
    return this.adapter.setSelectedCharacterRange(start, end, direction, text);
  }

  clearHistory() {
    return this.adapter.clearHistory();
  }

  updatePlaceholderVisibility(value) {
    value ??= this.value;
    this.placeholderElement.hidden = (value || "").length != 0;
  }

  #adapter = null;

  #setupPrivateStyleProps() {
    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.append(this.ownerDocument.createElement("slot"));
    }
    if (!this.shadowRoot.adoptedStyleSheets) {
      return this.style;
    }
    const privateStyleSheet = new this.ownerDocument.defaultView.CSSStyleSheet();
    privateStyleSheet.replaceSync(`:host {}`);
    for (const [name, value] of Object.entries(this.constructor.PRIVATE_CSS_PROPS)) {
      privateStyleSheet.cssRules[0].style.setProperty(
        name.replace(/[A-Z]/g, ($0) => `-${$0.toLowerCase()}`),
        value,
      );
    }
    this.shadowRoot.adoptedStyleSheets.push(privateStyleSheet);
    return privateStyleSheet.cssRules[0].style;
  }
};


export class Adapter {
  static CSS = ``;

  element = null;
  parent = null;

  #focusElement = null;
  get focusElement() {
    return this.#focusElement || this.element;
  }
  set focusElement(value) {
    this.#focusElement = (value === this.element) ? null : value;
  }

  constructor(parent) {
    if (this.constructor === Adapter) {
      throw new NotImplementedError("this is an abstract class");
    }
    this.parent = parent;
  }

  connectedCallback() {}
  disconnectedCallback() {}

  get value() {
    throw new NotImplementedError();
  }

  set value(value) {
    throw new NotImplementedError();
  }

  getSelectedCharacterRange() {
    throw new NotImplementedError();
  }

  setSelectedCharacterRange(start, end, direction, text) {
    throw new NotImplementedError();
  }

  clearHistory() {
    throw new NotImplementedError();
  }
}


export class TextAreaAdapter extends Adapter {
  constructor(parent) {
    super(parent);
    this.element = parent.ownerDocument.createElement("textarea");
  }

  connectedCallback() {
    if (!this._autoResizeCleanup) {
      setTimeout(() => {
        this._autoResizeCleanup = Utils.autoResizeTextarea(
          this.element,
          () => ({ style: this.parent.privateStyleProps }),
          "--flex-height",
        ).cleanup;
      }, 0);
    }
  }

  disconnectedCallback() {
    this._autoResizeCleanup();
    delete this._autoResizeCleanup;
  }

  get value() {
    return this.element.value;
  }

  set value(value) {
    this.element.value = value;
    this.element.dispatchEvent(new CustomEvent("x-autoresize-update"));
  }

  getSelectedCharacterRange() {
    const start = this.element.selectionStart;
    const end = this.element.selectionEnd;
    const direction = this.element.selectionDirection;
    return [start, end, direction, this.value.substring(start, end)];
  }

  setSelectedCharacterRange(start, end, direction, text) {
    if (text != null) {
      const prefix = this.value.substring(0, start);
      const suffix = this.value.substring(end);
      this.value = prefix + text + suffix;
      end = start + text.length;
    }
    const activeElement = document.activeElement;
    try {
      this.element.focus();
      this.element.setSelectionRange(start, end, direction);
    } finally {
      if (activeElement) {
        activeElement.focus();
      } else {
        this.element.blur();
      }
    }
  }

  clearHistory() {
    const value = this.element.value;
    this.element.value = "1";
    this.element.value = "2";
    this.element.value = value;
  }
}


export class NotImplementedError extends Error {
  constructor(message) {
    super("Not implemented" + (message ? `: ${message}` : ""));
  }
}


customElements.define(element.NAME, element);
