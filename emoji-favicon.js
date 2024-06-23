"use strict";


export default
class EmojiFavicon {
  static DEFAULT_ATTRIBUTE_NAME() { return "data-emoji-favicon"; }

  static set(emoji, shadowColor, size) {
    shadowColor = (typeof shadowColor === "string") ? shadowColor : null;
    size = (typeof size === "number" && size > 0) ? size : 64;

    if (emoji && emoji.length) {
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.href = this.renderEmoji(emoji, shadowColor, size);
      for (const oldLink of document.querySelectorAll("link[rel='icon']")) {
        oldLink.remove();
      }
      document.head.appendChild(newLink);
    }
  }

  static setFromAttribute(element, attributeName, size, forceShadowColor) {
    attributeName = (typeof attributeName === "string" && attributeName)
                     ? attributeName : this.DEFAULT_ATTRIBUTE_NAME();
    size = (typeof size === "number" && size > 0) ? size : 64;
    forceShadowColor = (typeof forceShadowColor === "string") ? forceShadowColor : null;

    if (!element.hasAttribute(attributeName)) {
      element.setAttribute(attributeName, "");
    }

    const setFromCurrentAttributeValue = () => {
      const args = this.parseAttributeValue(
        element.getAttribute(attributeName),
        forceShadowColor,
      );
      this.set.apply(this, args.concat([size]));
    };
    setFromCurrentAttributeValue();

    const emojiFaviconAttributeObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.attributeName === attributeName) {
          setFromCurrentAttributeValue();
        }
      }
    });
    emojiFaviconAttributeObserver.observe(element, { attributes: true });

    return {
      cleanup: () => {
        emojiFaviconAttributeObserver.disconnect();
      },
    };
  }

  static parseAttributeValue(attributeValue, forceShadowColor) {
    attributeValue = (typeof attributeValue === "string") ? attributeValue.trim() : "";
    forceShadowColor = (typeof forceShadowColor === "string") ? forceShadowColor.trim() : null;

    const valueParts = attributeValue.split(" ");
    const emoji = valueParts.splice(0, 1)[0].trim();
    const shadowColor = (forceShadowColor || valueParts.splice(0, 1)[0] || "").trim();

    return [emoji, shadowColor];
  }

  static renderEmoji(emoji, shadowColor, size) {
    emoji = (typeof emoji === "string") ? emoji.trim() : "";
    shadowColor = (typeof shadowColor === "string") ? shadowColor.trim() : null;
    size = (typeof size === "number" && size > 0) ? size : 64;

    const EMOJI_VARIATION_SELECTOR = "\uFE0F";

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;

    const ctx = canvas.getContext("2d");
    ctx.font = `${size * 0.875}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    if (shadowColor) {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 1 * size / 16;
    }
    for (let i = 0; i < (shadowColor ? 2 : 1); i++) {
      ctx.fillText(emoji + EMOJI_VARIATION_SELECTOR, size / 2, size);
    }

    return canvas.toDataURL("image/png");
  }
}


(function(currentScript) {
  if (!document.querySelector("head link[rel='icon']")) {
    const attributeName = EmojiFavicon.DEFAULT_ATTRIBUTE_NAME();
    for (const element of [currentScript, document.documentElement]) {
      if (element && element.hasAttribute(attributeName)) {
        EmojiFavicon.setFromAttribute(element, attributeName);
      }
    }
  }
})(document.currentScript);
