import { onMounted, onBeforeUnmount } from "vue";

/**
 * Solo celular (<= 768px): ajusta el alto del elemento al espacio realmente visible
 * (debajo del header, hasta el borde inferior visible) y reinicia el scroll del
 * contenedor exterior. Así no sobra alto, el layout exterior no se puede deslizar
 * y no aparece el hueco/panel blanco al final, aunque la barra del navegador
 * se esconda o aparezca. En PC no hace nada.
 */
export function useFitViewportHeight(selector) {
  let mq = null;
  let timer = null;

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
    const vv = window.visualViewport;
    const visibleBottom = Math.min(window.innerHeight, vv ? vv.height : Infinity);
    const layout = el.closest(".n-layout-content");
    const layoutBottom = layout ? layout.getBoundingClientRect().bottom : visibleBottom;
    const limit = Math.min(visibleBottom, layoutBottom);
    const top = el.getBoundingClientRect().top;
    // 20px = margen inferior de .layout-content-main
    const h = Math.max(280, Math.floor(limit - top - 20));
    el.style.setProperty("height", `${h}px`, "important");
    el.style.setProperty("max-height", `${h}px`, "important");
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(fit, 60);
  };

  onMounted(() => {
    mq = window.matchMedia("(max-width: 768px)");
    fit();
    // el header y el layout terminan de acomodarse un instante después
    setTimeout(fit, 150);
    setTimeout(fit, 500);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
  });

  onBeforeUnmount(() => {
    clearTimeout(timer);
    window.removeEventListener("resize", schedule);
    window.visualViewport?.removeEventListener("resize", schedule);
  });
}
