import test from "node:test";
import assert from "node:assert/strict";

import { isValidReviewQrUrl, REVIEW_QR_MAX_URL_LENGTH } from "./reviewQr.js";

test("reviewQr: acepta enlaces https con dominio", () => {
  assert.equal(isValidReviewQrUrl("https://example.com/calificanos"), true);
  assert.equal(isValidReviewQrUrl("  https://example.com  "), true);
});

test("reviewQr: rechaza esquemas, credenciales y espacios", () => {
  assert.equal(isValidReviewQrUrl("http://example.com"), false);
  assert.equal(isValidReviewQrUrl("javascript:alert(1)"), false);
  assert.equal(isValidReviewQrUrl("https://usuario:clave@example.com"), false);
  assert.equal(isValidReviewQrUrl("https://example.com/a b"), false);
  assert.equal(isValidReviewQrUrl("https://"), false);
  assert.equal(isValidReviewQrUrl(""), false);
});

test("reviewQr: respeta el máximo de 150 caracteres", () => {
  const prefix = "https://example.com/";
  const atLimit = prefix + "a".repeat(REVIEW_QR_MAX_URL_LENGTH - prefix.length);
  const overLimit = atLimit + "a";

  assert.equal(atLimit.length, REVIEW_QR_MAX_URL_LENGTH);
  assert.equal(isValidReviewQrUrl(atLimit), true);
  assert.equal(isValidReviewQrUrl(overLimit), false);
});
