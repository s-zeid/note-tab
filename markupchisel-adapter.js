import * as MarkupChisel from "./lib/markupchisel.lite.bundle.esm.js";

const { codemirror, lezer } = MarkupChisel.imports;
const commands = codemirror.commands;
const state = codemirror.state;
const { Prec } = state;
const view = codemirror.view;

import * as TextInput from "./textinput.js";


export { adapter as default };
export { adapter as MarkupChiselAdapter };
const adapter = class MarkupChiselAdapter extends TextInput.Adapter {
  static CSS = `
    .cm-editor.cm-focused {
      outline: none;
    }
    .cm-editor :is(.cm-scroller, .cm-content) {
      height: 100%; min-height: inherit;
    }
    .cm-editor :is(.cm-content, .cm-line) {
      padding: 0;
    }
    .cm-editor .cm-content {
      padding-block-end: 0.125em;
    }
    .cm-editor .cm-scroller {
      line-height: inherit;
    }
  `;

  constructor(parent) {
    super(parent);

    this.markupChisel = new MarkupChisel.MarkupChiselView({
      root: parent.shadowRoot || parent.ownerDocument,
      extensions: [
        Prec.highest(view.keymap.of([
          { key: "Mod-Enter", run: view => true, },
        ])),
        Prec.high(view.keymap.of([
          { key: "Mod-i", run: commands.insertTab, },
          { key: "Alt-i", run: commands.selectParentSyntax, },
          { key: "Mod-\\", run: commands.selectParentSyntax, },
        ])),
        view.ViewPlugin.fromClass(class {
          constructor(view) {
            this.view = view;
            this.editorInputEventListener = (event) => {
              if (!event._fromMarkupChiselAdapter) {
                event.stopImmediatePropagation();
                return;
              }
            };
            this.view.dom.addEventListener("input", this.editorInputEventListener);
          }

          update(update) {
            if (
              update.docChanged &&
              update.transactions.some(txn => txn.annotation(state.Transaction.userEvent))
            ) {
              const event = new InputEvent("input", {
                bubbles: true,
                composed: true,
                data: "",  // TODO: implement
                inputType: "",  // TODO: implement
                isComposing: update.transactions.some(txn => txn.isUserEvent("input.type.compose")),
              });
              event._fromMarkupChiselAdapter = true;
              this.view.dom.dispatchEvent(event);
            }
          }

          destroy() {
            this.view.dom.removeEventListener("input", this.editorInputEventListener);
          }
        }),
      ],
    });

    this.element = this.markupChisel.dom;
    this.focusElement = this.markupChisel.contentDOM;
  }

  connectedCallback() {}

  disconnectedCallback() {}

  get value() {
    return this.markupChisel.state.doc.toString();
  }

  set value(value) {
    this.markupChisel.dispatch({ changes: { from: 0, to: this.markupChisel.state.doc.length, insert: value } });
  }

  getSelectedCharacterRange() {
    const selection = this.markupChisel.state.selection.asSingle();
    const anchor = selection.ranges[0].anchor;
    const head = selection.ranges[0].head;
    let [start, end, direction] = [0, 0, "none"];
    if (anchor > head) {
      [start, end, direction] = [head, anchor, "backward"];
    } else {
      [start, end, direction] = [anchor, head, (anchor == head) ? "none" : "forward"];
    }
    return [start, end, direction, this.markupChisel.state.sliceDoc(start, end)];
  }

  setSelectedCharacterRange(start, end, direction, text) {
    if (text != null) {
      this.markupChisel.dispatch({ changes: [{ from: start, to: end, insert: text }] });
      end = start + text.length;
    }
    let [anchor, head] = [start, end];
    if (direction == "backward") {
      [anchor, head] = [head, anchor];
    }
    const selection = state.EditorSelection.single(anchor, head);
    this.markupChisel.dispatch({ selection });
  }
}
