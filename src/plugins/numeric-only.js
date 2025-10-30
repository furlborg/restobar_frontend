let guardsRegistered = false;
let isProgrammaticInput = false;

const DEFAULT_DECIMAL_PLACES = 2;

const CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End"
]);

function normaliseDecimalsSetting(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "object") {
    if ("decimals" in value) {
      return normaliseDecimalsSetting(value.decimals);
    }
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  return Math.max(0, Math.floor(numericValue));
}

function parseDecimalPlaces(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "string" && value.toLowerCase() === "any") {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  const normalised = numericValue.toString();
  const exponentMatch = normalised.match(/e-?(\d+)/i);
  if (exponentMatch) {
    return Math.max(
      0,
      parseInt(exponentMatch[1], 10)
    );
  }
  const parts = normalised.split(".");
  return parts.length === 2 ? parts[1].length : 0;
}

function deriveDecimalPlaces(target) {
  const candidates = [
    parseDecimalPlaces(target.getAttribute("step") ?? target.step),
    parseDecimalPlaces(target.getAttribute("min") ?? target.min),
    parseDecimalPlaces(target.getAttribute("max") ?? target.max)
  ].filter((value) => typeof value === "number");

  if (!candidates.length) {
    return null;
  }

  return Math.max(...candidates);
}

function resolveNumericConfig(target) {
  if (!(target instanceof HTMLInputElement)) {
    return null;
  }

  const container =
    target.closest("[data-numeric-only]") ?? target.closest(".n-input-number");

  if (!container) {
    return null;
  }

  const mode =
    target.dataset.numericMode ||
    container.dataset.numericMode ||
    "decimal";

  const allowDecimal = mode !== "integer";

  let decimalPlaces =
    normaliseDecimalsSetting(target.dataset.numericDecimals) ??
    normaliseDecimalsSetting(container.dataset.numericDecimals);

  if (!allowDecimal || decimalPlaces === 0) {
    return {
      allowDecimal: false,
      decimalPlaces: 0
    };
  }

  const derivedDecimals = deriveDecimalPlaces(target);

  if (typeof decimalPlaces === "number") {
    if (typeof derivedDecimals === "number") {
      decimalPlaces = Math.max(decimalPlaces, derivedDecimals);
    }
  } else if (allowDecimal) {
    if (typeof derivedDecimals === "number") {
      decimalPlaces = Math.max(DEFAULT_DECIMAL_PLACES, derivedDecimals);
    } else {
      decimalPlaces = DEFAULT_DECIMAL_PLACES;
    }
  }

  return {
    allowDecimal,
    decimalPlaces
  };
}

function sanitiseNumericValue(value, allowDecimal, decimalPlaces) {
  let sanitised = value.replace(/,/g, ".").replace(/[^\d.]/g, "");

  if (!allowDecimal || decimalPlaces === 0) {
    return sanitised.replace(/\./g, "");
  }

  const dotIndex = sanitised.indexOf(".");
  if (dotIndex === -1) {
    return sanitised;
  }

  const whole = sanitised.slice(0, dotIndex);
  const decimalsSource = sanitised.slice(dotIndex + 1).replace(/\./g, "");
  const limitedDecimals =
    typeof decimalPlaces === "number"
      ? decimalsSource.slice(0, decimalPlaces)
      : decimalsSource;

  if (limitedDecimals.length === 0 && sanitised.endsWith(".")) {
    return `${whole}.`;
  }

  return limitedDecimals.length ? `${whole}.${limitedDecimals}` : whole;
}

function clampCaretPosition(position, length) {
  if (position == null) {
    return length;
  }
  if (position < 0) {
    return 0;
  }
  if (position > length) {
    return length;
  }
  return position;
}

function handleKeydown(event) {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey) {
    return;
  }

  const target = event.target;
  const config = resolveNumericConfig(target);
  if (!config) {
    return;
  }

  const key = event.key;

  if (CONTROL_KEYS.has(key)) {
    return;
  }

  if (key === "." || key === ",") {
    if (!config.allowDecimal) {
      event.preventDefault();
      return;
    }

    const value = target.value;
    const selectionStart = target.selectionStart ?? value.length;
    const selectionEnd = target.selectionEnd ?? value.length;
    const selectedText = value.slice(selectionStart, selectionEnd);

    if (value.includes(".") && !selectedText.includes(".")) {
      event.preventDefault();
    }
    return;
  }

  if (/^\d$/.test(key)) {
    if (
      config.allowDecimal &&
      typeof config.decimalPlaces === "number" &&
      config.decimalPlaces >= 0
    ) {
      const value = target.value;
      const decimalIndex = value.indexOf(".");
      if (decimalIndex !== -1) {
        const selectionStart = target.selectionStart ?? value.length;
        const selectionEnd = target.selectionEnd ?? value.length;
        const decimalsStart = decimalIndex + 1;

        if (selectionEnd > decimalIndex) {
          const decimalsSection = value.slice(decimalsStart);
          const selectionStartInDecimals = Math.max(
            0,
            selectionStart - decimalsStart
          );
          const selectionEndInDecimals = Math.max(
            0,
            selectionEnd - decimalsStart
          );
          const selectedDecimalsLength = Math.max(
            0,
            selectionEndInDecimals - selectionStartInDecimals
          );
          const decimalsRemaining =
            decimalsSection.length - selectedDecimalsLength;

          if (decimalsRemaining >= config.decimalPlaces) {
            event.preventDefault();
            return;
          }
        }
      }
    }
    return;
  }

  event.preventDefault();
}

function handleInput(event) {
  if (isProgrammaticInput) {
    return;
  }

  const target = event.target;
  const config = resolveNumericConfig(target);
  if (!config) {
    return;
  }

  const originalValue = target.value;
  const selectionStart = target.selectionStart;
  const sanitisedValue = sanitiseNumericValue(
    originalValue,
    config.allowDecimal,
    config.decimalPlaces
  );

  if (sanitisedValue === originalValue) {
    return;
  }

  const diff = originalValue.length - sanitisedValue.length;

  isProgrammaticInput = true;
  target.value = sanitisedValue;

  const caret = clampCaretPosition(
    (selectionStart ?? sanitisedValue.length) - diff,
    sanitisedValue.length
  );

  try {
    target.setSelectionRange(caret, caret);
  } catch (error) {
    // Some input types do not support selection updates (e.g., type=number on certain browsers).
    // Swallow the error silently.
  }

  isProgrammaticInput = false;
}

export function setupNumericOnlyGuards() {
  if (guardsRegistered || typeof window === "undefined") {
    return;
  }
  guardsRegistered = true;

  document.addEventListener("keydown", handleKeydown, true);
  document.addEventListener("input", handleInput, true);
}

function applyDirectiveState(el, binding) {
  el.dataset.numericOnly = "true";

  const isInteger =
    binding?.modifiers?.integer || binding?.value === "integer";

  if (isInteger) {
    el.dataset.numericMode = "integer";
    delete el.dataset.numericDecimals;
    return;
  }

  el.dataset.numericMode = "decimal";

  const explicitDecimals = normaliseDecimalsSetting(binding?.value);
  const decimals = explicitDecimals ?? DEFAULT_DECIMAL_PLACES;

  el.dataset.numericDecimals = String(decimals);
}

export const numericOnlyDirective = {
  mounted(el, binding) {
    applyDirectiveState(el, binding);
  },
  updated(el, binding) {
    applyDirectiveState(el, binding);
  },
  unmounted(el) {
    delete el.dataset.numericOnly;
    delete el.dataset.numericMode;
    delete el.dataset.numericDecimals;
  }
};
