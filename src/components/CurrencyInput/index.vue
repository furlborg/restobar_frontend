<template>
  <div class="currency">
    <label class="currency-wrapper" :class="{ shake: shouldShake }">
      <div class="currency-sign" :class="{ 'should-shrink': touched }">S/.</div>
      <div class="input-section">
        <input
          class="fs-1"
          ref="divisor"
          v-model="amount_value"
          @keydown="onKeyDown"
          @input="applyMask($event)"
          :maxlength="maxLength"
          v-autowidth
        />
        <input
          ref="remainder"
          v-show="remainder > 0 || showRemainder"
          v-model="remainder"
          @keydown="onRemainderKeydown"
          maxlength="2"
        />
        <span class="ghostElement" ref="ghostElement"></span>
      </div>
    </label>
  </div>
</template>

<script>
import { defineComponent, ref, toRefs, nextTick, onMounted } from "vue";
import { directive as VueInputAutowidth } from "vue-input-autowidth";

export default defineComponent({
  name: "CurrencyInput",
  directives: { autowidth: VueInputAutowidth },
  props: {
    amount: {
      type: Number,
      default: 0,
    },
  },
  setup() {
    const amount_value = ref(0);
    const remainder = ref();
    const divisor = ref();
    const showRemainder = ref(false);
    const minWidth = ref(0);
    const ghostElement = ref(null);
    const touched = ref(false);
    const shouldShake = ref(false);
    const maxLength = ref(9);

    const shiftFocus = (e) => {
      // Switch to the cents input
      showRemainder.value = true;
      // Focus on the cents input after revealing it
      nextTick(() => remainder.value.focus());
      // Prevent the period from being typed
      e.preventDefault();
      return;
    };

    const shiftBack = (e) => {
      // Switch to the cents input
      showRemainder.value = false;
      // Focus on the cents input after revealing it
      nextTick(() => divisor.value.focus());
      // Prevent the period from being typed
      e.preventDefault();
      return;
    };

    const isNumber = (e) => {
      let charCode = e.which ? e.which : e.keyCode;
      // could just say "return" this if statement
      if (
        charCode > 31 &&
        (charCode < 48 || charCode > 57) &&
        charCode !== 46
      ) {
        return false;
      }
      return true;
    };

    const isArrowKey = (e) => {
      // putting this logic out here to keep the resize function from getting muddled
      return e.which === 37 || e.which == 39;
    };

    const onKeyDown = (e) => {
      // if typing a period - refactor to switch statement
      currencyFilter(e);
      let isAtInputStart =
        divisor.value.length === e.target.selectionStart && e.which === 39;
      if (e.which === 190 || (isArrowKey(e) && isAtInputStart)) {
        shiftFocus(e);
      } else if (!isNumber(e) && !isArrowKey(e)) {
        e.preventDefault();
      } else if (isArrowKey(e)) {
        return;
      } else {
        // resize(e);
      }
    };

    const onRemainderKeydown = (e) => {
      const isPeriod = e.which === 190;
      const isBackspace = e.which === 8;
      const isLeftArrowKey = e.which === 37;

      // Prevent the user from typing if they try and type anything that is not a number, arrow key, or backspace
      let shouldPreventTyping = (!isNumber(e) && !isArrowKey(e)) || isPeriod;

      if (shouldPreventTyping) e.preventDefault();

      /* We need to know if they try to arrow back at the beginning of the cents input,
      which means we need caret position + which arrow they used. */
      let isAtInputStart = e.target.selectionStart == 0 && isLeftArrowKey;
      // if cents is empty and they hit backspace, focus them back on the main input
      if ((isBackspace && !remainder) || (isArrowKey(e) && isAtInputStart))
        shiftBack(e);
    };

    const resize = (e) => {
      let newValue;

      if (e.which === 8) {
        // If we are backspacing, we want to calculate the width based on the current value of the input minus one letter
        newValue = divisor.value.substring(0, divisor.value.length - 1);
      } else {
        // Gonna refactor this later to not use refs and use rely on the model value 👌
        touched.value = true;
        newValue = divisor.value;
      }

      ghostElement.value.innerHTML = newValue;

      /* let newWidth = ghostElement.value.getBoundingClientRect().width;
      if (newWidth < minWidth.value) {
        newWidth = minWidth.value;
      }
      if (newWidth != divisor.value.getBoundingClientRect().width) {
        divisor.value.style.width = newWidth + "px";
      } */
    };

    const applyMask = (e) => {
      divisor.value = currencyFormatter(divisor.value);
      amount_value.value = divisor.value;
      // resize the input after inserting commas per the mask.
      resize(e);
    };

    const currencyFilter = (e) => {
      const isBackspace = e.which === 8;

      if (shouldResetInput(isBackspace)) {
        // When the user backspaces to the end, set the value to 0,
        // If they keep backspacing when empty, shake the input field
        divisor.value = "0";
        amount_value.value = 0;
        shakeInput();
        e.preventDefault();
      } else if (!parseInt(divisor.value)) {
        divisor.value = "";
      }
    };

    const shakeInput = () => {
      shouldShake.value = true;
      setTimeout(() => {
        shouldShake.value = false;
      }, 1000);
    };

    const currencyFormatter = (value) => {
      value = value.toString();
      // Clear left side zeros
      while (value.charAt(0) === "0") {
        value = value.substr(1);
      }

      value = value.replace(/[^\d.]/g, "");
      if (value.length > 3) {
        let intDiv = Math.floor(value.length / 3);
        while (intDiv > 0) {
          let lastComma = value.indexOf(",");
          if (lastComma < 0) {
            lastComma = value.length;
          }
          if (lastComma - 3 > 0) {
            value = `${value.slice(0, lastComma - 3)},${value.slice(
              lastComma - 3
            )}`;
          }
          intDiv--;
        }
      }
      return value;
    };

    const shouldResetInput = (isBackspace) => {
      return (
        (!parseInt(divisor.value) && isBackspace) ||
        (isBackspace && divisor.value.toString().length <= 1)
      );
    };

    onMounted(() => {
      ghostElement.value.classList.add("vue-input-autosize-mirror");
      setTimeout(() => {
        const styles = window.getComputedStyle(divisor.value);
        Object.assign(ghostElement.value.style, {
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "auto",
          whiteSpace: "nowrap",
          opacity: 0,
          border: styles.getPropertyValue("border"),
          fontSize: styles.getPropertyValue("font-size"),
          fontFamily: styles.getPropertyValue("font-family"),
          fontWeight: styles.getPropertyValue("font-weight"),
          letterSpacing: styles.getPropertyValue("letter-spacing"),
          padding: styles.getPropertyValue("padding"),
          textTransform: styles.getPropertyValue("text-transform"),
        });
        ghostElement.value.innerHTML = divisor.value;
      }, 0);
    });

    return {
      amount_value,
      remainder,
      showRemainder,
      minWidth,
      ghostElement,
      touched,
      shouldShake,
      maxLength,
      divisor,
      applyMask,
      onKeyDown,
      onRemainderKeydown,
    };
  },
});
</script>

<style lang="scss" scoped>
$green: #00c730;
$vue-navy: #2c3e50;
$vue-navy-light: #3a5169;
$vue-teal: #42b883;
$vue-teal-light: #42b983;

h1 {
  font-size: 5em;
  font-weight: 100;
  text-align: center;
  margin-bottom: 0;
  color: $vue-teal;
}

.currency-wrapper {
  display: flex;
  position: relative;

  &.shake {
    animation: shake 0.4s;
  }

  input {
    border: none;
    color: $vue-teal;
    outline: none;
    font-family: "Source Sans Pro", sans-serif;

    &.cents {
      box-shadow: none;
      width: 83px;
      align-self: flex-start;
      position: absolute;
      right: -87px;
      top: 7px;
      transition: all 200ms linear;
      font: 300 75px "Source Sans Pro", sans-serif;
    }
  }

  .currency-sign {
    font-weight: 100;
    color: $vue-teal;
    transition: all 200ms ease;

    &.should-shrink {
      font-size: 75px;
    }
  }

  .input-section {
    position: relative;
    display: flex;
  }
}

.currency {
  text-align: center;
  width: 80px;
  font-weight: 100;
}

.error {
  position: absolute;
  bottom: -50px;
  width: 100%;
  text-align: center;
}

@keyframes shake {
  from,
  to {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    -webkit-transform: translate3d(-10px, 0, 0);
    transform: translate3d(-10px, 0, 0);
  }

  20%,
  40%,
  60%,
  80% {
    -webkit-transform: translate3d(10px, 0, 0);
    transform: translate3d(10px, 0, 0);
  }
}
</style>