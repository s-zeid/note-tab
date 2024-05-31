import * as Utils from "./utils.js";


export { element as default };
export { element as NTTextInputElement };
const element = class NTTextInputElement extends HTMLElement {
  static NAME = "note-tab-textinput";

  static CSS = `
    ${this.NAME}:where(:not([hidden])) {
      display: block; height: var(--base-height); overflow: auto; resize: auto;
      background: Field; color: FieldText; font: medium system-ui;
      --base-height: calc(var(--computed-line-height, 1.2) * var(--rows, -1) + 1px);
    }
    ${this.NAME}:where([flex]) {
      min-height: var(--base-height);
      height: var(--flex-height, auto);
    }
    ${this.NAME}:where(:not([hidden]):focus-within) {
      outline: 2px solid SelectedItem;
    }
    ${this.NAME} > * {
      display: block; width: 100%; height: 100%; margin: 0; padding: 0;
      background: transparent; color: inherit; font: inherit; line-height: inherit;
      border: none; resize: none;
    }
    ${this.NAME} > *:focus {
      outline: none;
    }
  `;

  static PRIVATE_CSS_PROPS = {
    "--rows": 2,
  };

  constructor() {
    super();
    this.privateStyleProps = this.#setupPrivateStyleProps();

    const initialValue = this.innerHTML;
    this.replaceChildren();
    this.adapter = new TextAreaAdapter(this);

    if (initialValue) {
      this.adapter.value = initialValue;
    }
  }

  connectedCallback() {
    if (!this.ownerDocument.querySelector(`style[id="${CSS.escape(this.NAME)}"]`)) {
      const style = this.ownerDocument.createElement("style");
      style.id = this.constructor.NAME;
      style.textContent = this.constructor.CSS;
      this.ownerDocument.head.append(style);
    }
    Utils.setComputedLineHeight(this, { style: this.privateStyleProps });
    this.adapter.connectedCallback();
  }

  disconnectedCallback() {
    this.adapter.disconnectedCallback();
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
    if (this.#adapter) {
      value.value = this.#adapter.value;
    }
    const oldAdapter = this.#adapter;
    this.#adapter = value;
    this.replaceChildren(this.#adapter.element);
    oldAdapter?.disconnectedCallback();
    if (this.parentElement) {
      this.adapter.connectedCallback();
    }
  }

  get value() {
    return this.adapter.value;
  }

  set value(value) {
    this.adapter.value = value;
  }

  get flex() {
    return this.hasAttribute("flex");
  }

  set flex(value) {
    this.toggleAttribute("flex", value != null);
  }

  get placeholder() {
    return this.adapter.placeholder;
  }

  set placeholder(value) {
    this.adapter.placeholder = value;
    this.setAttribute("placeholder", value);
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
  element = null;

  constructor(parent) {
    if (this.constructor === Adapter) {
      throw new NotImplementedError("this is an abstract class");
    }
  }

  connectedCallback() {}
  disconnectedCallback() {}

  get value() {
    throw new NotImplementedError();
  }

  set value(value) {
    throw new NotImplementedError();
  }

  get placeholder() {
    throw new NotImplementedError();
  }

  set placeholder(value) {
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
          () => ({ style: this.element.parentElement.privateStyleProps }),
          "--flex-height",
        ).cleanup;
      }, 0);
    }
  }

  disconnectedCallback() {
    this._autoResizeCleanup();
  }

  get value() {
    return this.element.value;
  }

  set value(value) {
    this.element.value = value;
    this.element.dispatchEvent(new CustomEvent("x-autoresize-update"));
  }

  get placeholder() {
    return this.element.placeholder;
  }

  set placeholder(value) {
    this.element.placeholder = value;
  }
}


export class NotImplementedError extends Error {
  constructor(message) {
    super("Not implemented" + (message ? `: ${message}` : ""));
  }
}


customElements.define(element.NAME, element);
