import { h } from "vue";
import { NIcon } from "naive-ui";
import { OhVueIcon } from "@/plugins/icon";

export function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(OhVueIcon, { name: icon }) });
}

export function sleep(ms = 250) {
  // console.log('Kindly remember to remove `sleep`');
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addLight(color, amount) {
  const cc = parseInt(color, 16) + amount;
  const c = cc > 255 ? 255 : cc;
  return c.toString(16).length > 1 ? c.toString(16) : `0${c.toString(16)}`;
}

export function lighten(color, amount) {
  color = color.indexOf("#") >= 0 ? color.substring(1, color.length) : color;
  amount = Math.trunc((255 * amount) / 100);
  return `#${addLight(color.substring(0, 2), amount)}${addLight(
    color.substring(2, 4),
    amount
  )}${addLight(color.substring(4, 6), amount)}`;
}

export function isNumber(e) {
  let char = String.fromCharCode(e.keyCode);
  if (/^[0-9]+$/.test(char)) {
    return true;
  } else {
    e.preventDefault();
  }
}

export function isDecimal(e) {
  let char = String.fromCharCode(e.keyCode);
  if (/^[0-9.]+$/.test(char)) {
    return true;
  } else {
    e.preventDefault();
  }
}

export function isLetter(e) {
  let char = String.fromCharCode(e.keyCode);
  if (/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(char)) {
    return true;
  } else {
    e.preventDefault();
  }
}

export function isLetterOrNumber(e) {
  let char = String.fromCharCode(e.keyCode);
  if (/^[A-Za-zÀ-ÖØ-öø-ÿ0-9\-\s]+$/.test(char)) {
    return true;
  } else {
    e.preventDefault();
  }
}

export function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return "mobile";
  }
  return "desktop";
}

export const cloneDeep = require("clone-deep");
