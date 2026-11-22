(() => {
  const commandField = document.getElementById("install-text");
  const command = commandField.textContent;
  const options = [
    {
      tab: document.getElementById("tab-comando"),
      text: command,
      hint: "Execute na pasta do projeto com acesso ao repositório privado.",
      copyLabel: "Copiar comando de instalação",
      prefix: "$",
    },
    {
      tab: document.getElementById("tab-prompt"),
      text: "Instale a skill Requisitos e Protótipos neste projeto usando o comando " + command,
      hint: "Envie ao agente no chat da IDE com o projeto aberto e acesso ao repositório privado.",
      copyLabel: "Copiar prompt de instalação",
      prefix: "›",
    },
  ];
  const copyButton = document.getElementById("copy-install");
  const copyIcon = copyButton.querySelector("use");
  const status = document.getElementById("copy-status");
  let resetCopy;
  let activeOption;

  function setCopyLabel(label) {
    copyButton.setAttribute("aria-label", label);
    copyButton.title = label;
  }

  function clearFeedback() {
    clearTimeout(resetCopy);
    copyButton.classList.remove("copied");
    copyIcon.setAttribute("href", "#i-copy");
    status.textContent = "";
    setCopyLabel(activeOption.copyLabel);
  }

  function selectOption(option) {
    activeOption = option;
    for (const { tab } of options) {
      const selected = tab === option.tab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    document.getElementById("install-panel").setAttribute("aria-labelledby", option.tab.id);
    document.getElementById("install-hint").textContent = option.hint;
    document.getElementById("prefix").textContent = option.prefix;
    commandField.textContent = option.text;
    clearFeedback();
  }

  options.forEach((option, index) => {
    option.tab.addEventListener("click", () => selectOption(option));
    option.tab.addEventListener("keydown", event => {
      const keys = { ArrowRight: 1 - index, ArrowLeft: 1 - index, Home: 0, End: 1 };
      if (!Object.hasOwn(keys, event.key)) return;
      event.preventDefault();
      const next = options[keys[event.key]];
      selectOption(next);
      next.tab.focus();
    });
  });
  selectOption(options[0]);

  function selectText() {
    const range = document.createRange();
    range.selectNodeContents(commandField);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  copyButton.addEventListener("click", async () => {
    const option = activeOption;
    try {
      await navigator.clipboard.writeText(option.text);
    } catch {
      if (option !== activeOption) return;
      selectText();
      if (!document.execCommand("copy")) {
        status.textContent = "Texto selecionado. Use o atalho de copiar do seu dispositivo.";
        document.getElementById("install-hint").textContent = status.textContent;
        return;
      }
      window.getSelection().removeAllRanges();
    }
    if (option !== activeOption) return;
    clearFeedback();
    setCopyLabel("Copiado");
    copyButton.classList.add("copied");
    copyIcon.setAttribute("href", "#i-check");
    status.textContent = "Copiado para a área de transferência.";
    resetCopy = setTimeout(clearFeedback, 2200);
  });

  const dialog = document.getElementById("viewer-dialog");
  const frame = document.getElementById("viewer-frame");
  const launch = document.getElementById("open-viewer");
  launch.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || !dialog.showModal) return;
    event.preventDefault();
    if (!frame.hasAttribute("src")) frame.src = "arquivos/viewer.html" + launch.search;
    dialog.showModal();
  });
  window.addEventListener("message", event => {
    const expectedOrigin = location.protocol === "file:" ? "null" : location.origin;
    if (event.source !== frame.contentWindow || event.origin !== expectedOrigin) return;
    if (dialog.open && event.data === "pitang:fechar-viewer") dialog.close();
  });
  document.getElementById("close-viewer").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => launch.focus({ preventScroll: true }));
})();
