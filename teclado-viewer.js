// Tour e notas têm seus próprios controles de teclado.
window.addEventListener("keydown", event => {
  if (event.key !== "Escape" || event.defaultPrevented || event.repeat) return;
  if (document.querySelector(".tour[data-open], .pop[data-open], dialog[open]")) return;
  if (window.parent === window) return;
  event.preventDefault();
  const collapse = document.querySelector(".app[data-expanded] [data-expand]");
  if (collapse) {
    event.stopPropagation();
    collapse.click();
    return;
  }
  const origin = location.protocol === "file:" ? "*" : location.origin;
  window.parent.postMessage("pitang:fechar-viewer", origin);
}, true);
