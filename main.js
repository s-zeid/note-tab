import * as Utils from "./utils.js";


class App {
 get MAGIC() {
  return "46e56985-cff3-45fd-b1b7-c5f84fbb921c";
 }
 
 constructor(container) {
  this.els = {
   container: container,
   link: container.querySelector("#link"),
   download: container.querySelector("#download"),
   new_: container.querySelector("#new"),
   saved: container.querySelector("#saved"),
   type: container.querySelector("#type"),
   title: container.querySelector("#title"),
   body: container.querySelector("#body"),
  };
  
  this.state = {
   _els: this.els,
   loaded: false,
   get saved() {
    return this._els.saved.value != "";
   },
   set saved(value) {
    this._els.saved.value = value ? "true" : "";
   },
  };
  
  this.baseURI = null;
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
  Utils.formatFromAttribute(this.els.new_, "href", f => {
   f = f.replace("{0}", this.baseURI);
   f = f.replace("{1}", type);
   return f;
  });
  Utils.formatFromAttribute(this.els.new_, "title", f => f.replace("{0}", type));
  Utils.formatFromAttribute(this.els.title, "placeholder", f => f.replace("{0}", type));
  
  let title = params.get("title") || this.els.title.value;
  this.els.title.value = title;
  this.els.title.dispatchEvent(new CustomEvent("x-autoresize-update"));
  
  let body = params.get("body") || this.els.body.value;
  this.els.body.value = body;
  this.els.body.dispatchEvent(new CustomEvent("x-autoresize-update"));
  
  this.update(false);
  
  if (!window.history.state)
   this.save(false);
  
  this.state.loaded = true;
 }
 
 update(doState) {
  if (typeof doState === "undefined")
   doState = true;
  
  if (doState)
   this.state.saved = false;
  
  let hash = this.makeHash();
  this.els.link.href = hash;
  this.setDocumentTitle();
  
  if (doState)
   this.replaceState(hash);
 }
 
 setDocumentTitle() {
  let title = this.els.title.value || this.els.title.placeholder;
  if (this.state.saved === false)
   title = "* " + title;
  if (document.title != title)
   document.title = title;
 }
 
 save(saveHash) {
  if (typeof saveHash === "undefined")
   saveHash = true;
  
  this.state.saved = true;
  this.setDocumentTitle();
  this.replaceState(null, saveHash);
 }
 
 download() {
  const NL = !navigator.userAgent.includes("Windows") ? "\n" : "\r\n";
  
  let title = "";
  let titleContents = "";
  if (this.els.title.value) {
   title = this.els.title.value;
   let separator = "=".repeat(Math.min(title.length, 76));
   titleContents = `${title}${NL}${separator}${NL+NL}`;
  } else {
   title = this.els.title.placeholder;
  }
  let contents = `${titleContents}${this.els.body.value}${NL}`;
  
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
 
 replaceState(hash, saveHash) {
  let stateHash = hash || this.makeHash();
  let state = {
   hash: Utils.StructuredCloneHash.encode(stateHash, this.MAGIC),
   saved: this.state.saved,
  };
  let url = undefined;
  if (saveHash)
   url = this.baseURI + stateHash;
  window.history.replaceState(state, document.title, url);
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
  if (navigator.userAgent.match(/Gecko[\/]/))
   document.documentElement.classList.add("gecko");
  if (navigator.userAgent.match(/WebKit/))
   document.documentElement.classList.add("webkit");
  
  this.baseURI = window.location.href.replace(/#.*$/, "");
  this.initialTitle = document.title;
  
  this.load();
  
  window.addEventListener("hashchange", e => {
   window.history.replaceState(null, "");
   this.load();
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
  
  this.els.container.style.display = "block";
  
  Utils.autoResizeInput(this.els.title);
  Utils.autoResizeTextarea(this.els.body);
  
  if (!this.els.title.value && !this.els.body.value) {
   this.save();
   this.els.title.focus();
  }
 }
}


window.Utils = Utils;
window.app = new App(document.querySelector("app-container"));
window.addEventListener("DOMContentLoaded", () => app.main());
