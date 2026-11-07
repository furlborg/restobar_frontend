import { onMounted, onBeforeUnmount } from "vue";

/**
 * Solo celular (<= 768px): ajusta el alto del elemento al espacio realmente visible
 * (debajo del header, hasta el borde inferior visible) y reinicia el scroll del
 * contenedor exterior. Así no sobra alto, el layout exterior no se puede deslizar
 * y no aparece el hueco/panel blanco al final, aunque la barra del navegador
 * se esconda o aparezca. En PC no hace nada.
 *
 * Importante: mientras el usuario escribe en un campo (teclado abierto) NO se
 * recalcula nada. El teclado achica la ventana visible y, si se recalculara,
 * el panel se encogería y quedaría un hueco en blanco encima del teclado.
 */
const isTyping = () => {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
};

export function useFitViewportHeight(selector) {
  let mq = null;
  let timer = null;
  let lastWidth = 0;

  const fit = () => {
    const el = document.querySelector(selector);
    if (!el) return;
    if (!mq.matches) {
      el.style.removeProperty("height");
      el.style.removeProperty("max-height");
      return;
    }
    // Reinicia el scroll de todos los contenedores superiores (al entrar desde una lista deslizada)
    let parent = el.parentElement;
    while (parent) {
      if (parent.scrollTop) parent.scrollTop = 0;
      parent = parent.parentElement;
    }

    // n-layout-content ocupa toda la pantalla; su scrollbar interno toma el alto del contenido
    const layout = el.closest(".n-layout-content");
    const layoutBottom = layout ? layout.getBoundingClientRect().bottom : window.innerHeight;
    const limit = Math.min(window.innerHeight, layoutBottom);
    const top = el.getBoundingClientRect().top;
    // 20px = margen inferior de .layout-content-main
    const h = Math.max(280, Math.floor(limit - top - 20));
    el.style.setProperty("height", `${h}px`, "important");
    el.style.setProperty("max-height", `${h}px`, "important");
  };

  const onResize = () => {
    // Con el teclado abierto no tocamos el alto (ver nota arriba)
    if (isTyping() && window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(fit, 60);
  };

  // Al cerrar el teclado (o salir del campo) se vuelve a ajustar al espacio real
  const onFocusOut = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!isTyping()) fit();
    }, 350);
  };

  onMounted(() => {
    mq = window.matchMedia("(max-width: 768px)");
    lastWidth = window.innerWidth;
    fit();
    // el header y el layout terminan de acomodarse un instante después
    setTimeout(() => {
      if (!isTyping()) fit();
    }, 150);
    setTimeout(() => {
      if (!isTyping()) fit();
    }, 500);
    window.addEventListener("resize", onResize);
    document.addEventListener("focusout", onFocusOut);
  });

  onBeforeUnmount(() => {
    clearTimeout(timer);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("focusout", onFocusOut);
  });
}
