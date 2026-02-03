import { onBeforeUnmount } from 'vue';

export function useDebounce(fn, delay = 300) {
  let timeoutId = null;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const debounced = (...args) => {
    cancel();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delay);
  };

  onBeforeUnmount(cancel);

  return { debounced, cancel };
}
