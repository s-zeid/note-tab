import * as Utils from "./utils.js";


class App {
 get MAGIC() {
  return "46e56985-cff3-45fd-b1b7-c5f84fbb921c";
 }
 
 constructor(container) {
  this.els = {
   container: container,
   type: container.querySelector("#type"),
   title: container.querySelector("#title"),
   body: container.querySelector("#body"),
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
  this.initialTitle = null;
 }
 
 load() {
  let historyState = window.history.state || {
   hash: window.location.hash,
   saved: true,
  };
  this.state.saved = historyState.saved;
  
  let hash = Utils.StructuredCloneHash.decode(historyState.hash || "#");
  let params = new URLSearchParams(hash.substring(1));
  
  let type = params.get("type") || this.els.type.dataset["default"];
  this.els.type.value = type;
  Utils.formatFromAttribute(this.els.new_, "href", f => {
   f = f.replace("{0}", this.baseURI);
   f = f.replace("{1}", type);
   return f;
  });
  Utils.formatFromAttribute(this.els.new_, "title", f => f.replace("{0}", type));
  Utils.formatFromAttribute(this.els.title, "placeholder", f => f.replace("{0}", type));
  
  this.els.title.value = params.get("title") || "";
  this.els.title.dispatchEvent(new CustomEvent("x-autoresize-update"));
  
  this.els.body.value = params.get("body") || "";
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
 
 async open() {
  if (this.els.file.files.length) {
   let file = this.els.file.files[0];
   let contents = await file.text();
   this.state.saved = false;
   
   // Use the type from the filename (of the format `<title>.<type>.txt`)
   // if the filename matches the rules listed in <README.md#file-format>.
   const typeRegExp = /[^.]\.([a-zA-Z ]|[^\u0000-\u007f])+( \([0-9]+\)|-[0-9]+)?\.txt$/i;
   let type = this.els.type.dataset["default"];
   if (file.name.match(typeRegExp)) {
    let typeParts = file.name.split(".");
    let typeCandidate = typeParts[typeParts.length - 2];
    if (!typeCandidate.startsWith(" "))
     type = typeCandidate.replace(/( \([0-9]+\)|-[0-9]+)$/, "");
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
   if (body.substring(body.length - 2) === "\r\n")
    body = body.substring(0, body.length - 2);
   else if (body.substring(body.length - 1) === "\n")
    body = body.substring(0, body.length - 1);
   
   this.els.type.value = type;
   this.els.title.value = title;
   this.els.body.value = body;
   this.save();
   this.load();
  }
 }
 
 download() {
  let title = "";
  let titleContents = "";
  if (this.els.title.value) {
   title = this.els.title.value;
   let separator = "=".repeat(Math.min(title.length, 76));
   titleContents = `${title}\n${separator}\n\n`;
  } else {
   title = this.els.title.placeholder;
  }
  let contents = `${titleContents}${this.els.body.value}\n`;
  
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
  
  this.els.title.addEventListener("input", e => this.updateOnInput(e));
  this.els.body.addEventListener("input", e => this.updateOnInput(e));
  document.documentElement.addEventListener("keyup", e => this.saveOnKeyUp(e));
  
  this.els.link.addEventListener("click", e => {
   if (!(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey))
    e.preventDefault();
   this.save();
  });
  
  this.els.download.addEventListener("click", () => this.download());
  
  this.els.file.value = "";
  this.els.file.addEventListener("change", () => this.open());
  this.els.open.addEventListener("click", () => this.els.file.click());
  
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
