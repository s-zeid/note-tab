import * as Utils from "./utils.js";


class App {
 get MAGIC() {
  return "46e56985-cff3-45fd-b1b7-c5f84fbb921c";
 }
 
 constructor() {
  this.els = {
   link: document.querySelector("#link"),
   download: document.querySelector("#download"),
   new_: document.querySelector("#new"),
   saved: document.querySelector("#saved"),
   type: document.querySelector("#type"),
   title: document.querySelector("#title"),
   body: document.querySelector("#body"),
  };
  
  this.state = {
   _els: this.els,
   changingHash: false,
   loaded: false,
   get saved() {
    return this._els.saved.value != "";
   },
   set saved(value) {
    this._els.saved.value = value ? "true" : "";
   },
  };
  
  this.initialTitle = null;
 }
 
 load() {
  let historyState = window.history.state || {
   hash: window.location.hash,
   saved: this.state.saved,
  };
  this.state.saved = historyState.saved;
  
  let hash = Utils.StructuredCloneHash.decode(historyState.hash || "#");
  let params = new URLSearchParams(hash.substring(1));
  
  let type = params.get("type") || this.els.type.value || this.els.type.dataset["default"];
  this.els.type.value = type;
  Utils.formatFromAttribute(this.els.new_, "href", f => f.replace("{0}", type));
  Utils.formatFromAttribute(this.els.new_, "title", f => f.replace("{0}", type));
  Utils.formatFromAttribute(this.els.title, "placeholder", f => f.replace("{0}", type));
  
  let title = params.get("title") || this.els.title.value;
  this.els.title.value = title;
  this.setDocumentTitle();
  
  let body = params.get("body") || this.els.body.value;
  this.els.body.value = body;
  
  this.state.loaded = true;
 }
 
 update() {
  this.state.saved = false;
  
  let hash = this.makeHash();
  this.els.link.href = hash;
  this.setDocumentTitle();
  this.replaceState(hash);
 }
 
 save() {
  this.state.changingHash = !this.state.saved;
  this.state.saved = true;
  this.setDocumentTitle();
  this.replaceState(null, true);
 }
 
 download() {
  const NL = !navigator.userAgent.includes("Windows") ? "\n" : "\r\n";
  
  let title = this.els.title.value || this.els.title.placeholder;
  let separator = "=".repeat(Math.min(title.length, 76));
  let contents = `${title}${NL}${separator}${NL+NL}${this.els.body.value}${NL}`;
  
  let url = URL.createObjectURL(new Blob(
   [contents], {type: "text/plain; charset=utf-8"}
  ));
  
  let a = document.createElement("a");
  a.href = url;
  a.download = `${title}.${this.els.type.value}.txt`.replace("/", "\u2044");
  a.style.display = "none";
  this.els.download.parentElement.insertBefore(a, this.els.download);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
 }
 
 setDocumentTitle() {
  let title = this.els.title.value || this.els.title.placeholder;
  if (this.state.saved === false)
   title = "* " + title;
  if (document.title != title)
   document.title = title;
 }
 
 makeHash() {
  let keys = ["type", "title", "body"];
  let params = [];
  for (let key of keys) {
   if (this.els[key] && this.els[key].value)
    params.push(
     encodeURIComponent(key) +
     "=" +
     encodeURIComponent(this.els[key].value)
    );
  }
  return "#" + params.join("&");
 }
 
 replaceState(hash, save) {
  let stateHash = hash || this.makeHash();
  let state = {
   hash: Utils.StructuredCloneHash.encode(stateHash, this.MAGIC),
   saved: this.state.saved,
  };
  window.history.replaceState(state, document.title, save ? stateHash : undefined);
 }
 
 updateOnInput(e) {
  if (e.isComposing)
   return;
  this.update();
 }
 
 saveOnKeyUp(e) {
  let isTitle = e.target === this.els.title;
  if ((e.ctrlKey || e.metaKey || isTitle) && e.code.match(/^(Numpad)?Enter$/))
   return this.save();
 }
 
 main() {
  if (!window.InputEvent)
   return;
  
  document.querySelector("#loading-error").style.display = "none";
  
  if (navigator.userAgent.match(/Gecko[\/]/))
   document.documentElement.classList.add("gecko");
  if (navigator.userAgent.match(/WebKit/))
   document.documentElement.classList.add("webkit");
  
  this.initialTitle = document.title;
  this.load();
  this.els.link.href = this.makeHash();
  
  window.addEventListener("hashchange", e => {
   this.state.saved = true;
   if (this.state.changingHash) {
    this.state.changingHash = false;
   } else {
    window.history.replaceState(null, "");
    this.load();
    this.els.title.dispatchEvent(new CustomEvent("x-autoresize-update"));
    this.els.body.dispatchEvent(new CustomEvent("x-autoresize-update"));
   }
  });
  
  Utils.formatFromAttribute(this.els.link, "title", f => {
   let ua = navigator.userAgent;
   f = f.replace("{0}", !ua.includes("Mac OS") ? "Ctrl" : "Command");
   f = f.replace("{1}", !ua.match(/Mobile|Tablet/) ? "right-click" : "long press");
   return f;
  });
  
  this.els.link.addEventListener("click", e => {
   if (!(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey))
    e.preventDefault();
   this.save();
  });
  
  this.els.download.addEventListener("click", () => this.download());
  
  this.els.title.addEventListener("input", e => this.updateOnInput(e));
  this.els.body.addEventListener("input", e => this.updateOnInput(e));
  document.documentElement.addEventListener("keyup", e => this.saveOnKeyUp(e));
  
  document.querySelector("app-container").style.display = "block";
  
  Utils.autoResizeInput(this.els.title);
  Utils.autoResizeTextarea(this.els.body);
  
  if (!this.els.title.value && !this.els.body.value) {
   this.save();
   this.els.title.focus();
  }
 }
}


window.Utils = Utils;
window.app = new App();
window.addEventListener("DOMContentLoaded", () => app.main());
