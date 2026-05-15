// ==UserScript==
// @name         Bangumi 维基编辑器
// @namespace    b38.dev
// @version      1.0.2
// @author       神戸小鳥 @vickscarlet
// @description  维基语法高亮与查错
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/scripts/wiki_editor
// @match        *://bgm.tv/subject/*/edit*
// @match        *://bgm.tv/character/*/edit*
// @match        *://bgm.tv/person/*/edit*
// @match        *://bgm.tv/new_subject/*
// @match        *://bgm.tv/persion/new
// @match        *://bgm.tv/character/new
// @match        *://bgm.tv/subject/*/ep/create
// @match        *://bangumi.tv/subject/*/edit*
// @match        *://bangumi.tv/character/*/edit*
// @match        *://bangumi.tv/person/*/edit*
// @match        *://bangumi.tv/new_subject/*
// @match        *://bangumi.tv/persion/new
// @match        *://bangumi.tv/character/new
// @match        *://bangumi.tv/subject/*/ep/create
// @match        *://chii.in/subject/*/edit*
// @match        *://chii.in/character/*/edit*
// @match        *://chii.in/person/*/edit*
// @match        *://chii.in/new_subject/*
// @match        *://chii.in/persion/new
// @match        *://chii.in/character/new
// @match        *://chii.in/subject/*/ep/create
// ==/UserScript==

(function () {
  'use strict';

  const svgTags = [
    "svg",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "path",
    "text",
    "g",
    "defs",
    "use",
    "symbol",
    "image",
    "clipPath",
    "mask",
    "pattern"
  ];
  function setEvents(element, events) {
    for (const [event, listener] of Object.entries(events)) {
      element.addEventListener(event, listener);
    }
    return element;
  }
  function setProps(element, props) {
    if (!props || typeof props !== "object") return element;
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === "boolean") {
        element[key] = value;
        continue;
      }
      if (key === "events") {
        if (value == null) continue;
        setEvents(element, value);
      } else if (key === "class") {
        addClass(element, value);
      } else if (key === "style" && typeof value === "object") {
        setStyle(element, value);
      } else {
        element.setAttribute(key, String(value));
      }
    }
    return element;
  }
  function addClass(element, value) {
    element.classList.add(...[value].flat());
    return element;
  }
  function setStyle(element, styles) {
    for (let [k, v] of Object.entries(styles)) {
      if (typeof v === "number" && v !== 0 && !["zIndex", "fontWeight"].includes(k)) {
        v = v + "px";
      }
      element.style[k] = v;
    }
    return element;
  }
  function create$1(name, props, ...childrens) {
    if (name == null) return null;
    const isSVG = name === "svg" || typeof name === "string" && svgTags.includes(name);
    if (isSVG) return createSVG(name, props, ...childrens);
    const element = name instanceof Element ? name : document.createElement(name);
    if (props === void 0) return element;
    if (Array.isArray(props) || props instanceof Node || typeof props !== "object") {
      return append(element, props, ...childrens);
    }
    return append(setProps(element, props), ...childrens);
  }
  function append(element, ...childrens) {
    const tag = element.tagName.toLowerCase();
    if (svgTags.includes(tag)) {
      return appendSVG(element, ...childrens);
    }
    for (const child of childrens) {
      if (Array.isArray(child)) {
        element.append(create$1(...child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else {
        element.append(document.createTextNode(String(child)));
      }
    }
    return element;
  }
  function createSVG(name, props, ...childrens) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    if (name === "svg") element.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    if (props === void 0) return element;
    if (Array.isArray(props) || props instanceof Node || typeof props !== "object") {
      return appendSVG(element, props, ...childrens);
    }
    return appendSVG(setProps(element, props), ...childrens);
  }
  function appendSVG(element, ...childrens) {
    for (const child of childrens) {
      if (Array.isArray(child)) {
        element.append(createSVG(...child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else {
        element.append(document.createTextNode(String(child)));
      }
    }
    return element;
  }
  function addStyle(...styles) {
    const style = document.createElement("style");
    style.append(document.createTextNode(styles.join("\n")));
    document.head.appendChild(style);
    return style;
  }
  const loadScript = (() => {
    const loaded = new Set();
    const pedding = new Map();
    return async (src) => {
      if (loaded.has(src)) return;
      const list = pedding.get(src) ?? [];
      const p = new Promise((resolve) => list.push(resolve));
      if (!pedding.has(src)) {
        pedding.set(src, list);
        const script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        script.onload = () => {
          loaded.add(src);
          list.forEach((resolve) => resolve());
        };
        document.body.appendChild(script);
      }
      return p;
    };
  })();
  async function load(monacoBase) {
    await loadScript(`${monacoBase}vs/loader.js`);
    return new Promise((resolve) => {
      const require2 = window.require;
      require2.config({
        paths: { vs: `${monacoBase}vs` },
        "vs/nls": { availableLanguages: { "*": "zh-cn" } }
      });
      require2(["vs/editor/editor.main"], () => resolve(window.monaco));
    });
  }
  function monaco() {
    let monaco2 = window.monaco;
    if (!monaco2) throw new Error("Monaco 未加载");
    return monaco2;
  }
  const STORAGE_KEY = "wiki-enhance-editor-config";
  class Config {
    inner = {};
    inner_ = {};
    listeners = {};
    constructor() {
      const html = document.children?.[0];
      this.isDark = html.getAttribute("data-theme") === "dark";
      new MutationObserver(() => {
        const isDark = html.getAttribute("data-theme") === "dark";
        if (this.isDark === isDark) return;
        this.isDark = isDark;
      }).observe(html, {
        attributes: true,
        attributeFilter: ["data-theme"],
        attributeOldValue: true,
        childList: false,
        characterData: false,
        subtree: false,
        characterDataOldValue: false
      });
      this.load();
    }
    get showLineNumber() {
      return this.inner.showLineNumber ?? true;
    }
    set showLineNumber(value) {
      this.inner.showLineNumber = value;
      this.call("showLineNumber", value);
      this.dump();
    }
    get showMiniMap() {
      return this.inner.showMiniMap ?? false;
    }
    set showMiniMap(value) {
      this.inner.showMiniMap = value;
      this.call("showMiniMap", value);
      this.dump();
    }
    get wordWrap() {
      return this.inner.wordWrap ?? false;
    }
    set wordWrap(value) {
      this.inner.wordWrap = value;
      this.call("wordWrap", value);
      this.dump();
    }
    get isDark() {
      return this.inner_.isDark ?? false;
    }
    set isDark(value) {
      this.inner_.isDark = value;
      this.call("isDark", value);
    }
    on(key, cb) {
      this.listeners[key] = this.listeners[key] || new Set();
      this.listeners[key].add(cb);
    }
    off(key, cb) {
      this.listeners[key]?.delete(cb);
    }
    call(key, value) {
      this.listeners[key]?.forEach((cb) => cb(value));
    }
    dump() {
      const json = JSON.stringify(this.inner);
      localStorage.setItem(STORAGE_KEY, json);
    }
    load() {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.inner = stored ? JSON.parse(stored) : {};
    }
  }
  const config = new Config();
  function validate(model) {
    const text = model.getValue();
    const markers = [];
    const { editor, MarkerSeverity: severity } = monaco();
    const lines = text.split(/\r?\n/);
    let cnt = 0;
    let superblock = null;
    let array = null;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (/^\s*$/.test(line)) continue;
      let startLineNumber = i + 1;
      let block = /^\s*{{\s*Infobox(?<type>\s+\S+)?\s*$/.exec(line);
      if (block) {
        let startColumn = line.indexOf("{{") + 1;
        if (!superblock) {
          superblock = {
            startLineNumber,
            startColumn,
            endLineNumber: startLineNumber,
            endColumn: startColumn + 9
          };
          if (!block.groups?.type) {
            markers.push({
              severity: severity.Warning,
              message: "没有类型",
              ...superblock
            });
          }
          cnt++;
          if (cnt > 1) {
            markers.push({
              severity: severity.Error,
              message: "只允许一个 '{{Infobox'",
              ...superblock
            });
          }
          continue;
        } else {
          markers.push({
            severity: severity.Error,
            message: "没有匹配的 '}}'",
            ...superblock
          });
          markers.push({
            severity: severity.Error,
            message: "意外的 '{{Infobox'\n上一个 '{{Infobox' 没有匹配的 '}}'",
            startLineNumber,
            startColumn,
            endLineNumber: startLineNumber,
            endColumn: startColumn + 9
          });
        }
        continue;
      }
      if (/^\s*}}\s*$/.test(line)) {
        if (!superblock) {
          let startColumn = line.indexOf("}}") + 1;
          markers.push({
            severity: severity.Error,
            message: "多余的 '}}'\n可能是漏了 '{{Infobox'",
            startLineNumber,
            startColumn,
            endLineNumber: startLineNumber,
            endColumn: startColumn + 2
          });
        } else {
          superblock = null;
        }
        continue;
      }
      if (/^\s*\|/.test(line)) {
        let field = /^(?<start>\s*\|\s*)(?<key>[^=]+?)?(?<operator>\s*=\s*)(?<value>.+?)?\s*$/.exec(
          line
        );
        if (!field) {
          markers.push({
            severity: severity.Error,
            message: "错误的字段格式",
            startLineNumber,
            startColumn: line.search(/\S/) + 1,
            endLineNumber: startLineNumber,
            endColumn: line.length
          });
          continue;
        }
        if (array) {
          markers.push({
            severity: severity.Error,
            message: "缺少匹配的 '}'",
            ...array
          });
          array = null;
        }
        let { start, key, operator, value } = field.groups ?? {};
        if (value && value.trim() == "{") {
          let startColumn = start.length + key.length + operator.length + 1;
          array = {
            startLineNumber,
            startColumn,
            endLineNumber: startLineNumber,
            endColumn: startColumn + 1
          };
        }
        continue;
      }
      if (/^\s*}\s*$/.test(line)) {
        if (!array) {
          let startColumn = line.indexOf("}") + 1;
          markers.push({
            severity: severity.Error,
            message: "多余的 '}'\n可能是漏了 '{'",
            startLineNumber,
            startColumn,
            endLineNumber: startLineNumber,
            endColumn: startColumn + 1
          });
        } else {
          array = null;
        }
        continue;
      }
      let item = /^(?<start>\s*)(?<open>\[)?(?<content>.*?)(?<close>\])?\s*$/.exec(line);
      if (item) {
        if (!array) {
          markers.push({
            severity: severity.Error,
            message: "意外的数组项\n可能是漏了 '{'",
            startLineNumber,
            startColumn: line.search(/\S/) + 1,
            endLineNumber: startLineNumber,
            endColumn: line.length
          });
        }
        if (!item.groups?.open) {
          markers.push({
            severity: severity.Error,
            message: "缺少 '['",
            startLineNumber,
            startColumn: (item.groups?.start?.length ?? 0) + 1,
            endLineNumber: startLineNumber,
            endColumn: line.length
          });
        }
        if (!item.groups?.close) {
          markers.push({
            severity: severity.Error,
            message: "缺少 ']'",
            startLineNumber,
            startColumn: (item.groups?.start?.length ?? 0) + 1,
            endLineNumber: startLineNumber,
            endColumn: line.length
          });
        }
        continue;
      }
      markers.push({
        severity: severity.Error,
        message: "未知内容",
        startLineNumber,
        startColumn: line.search(/\S/) + 1,
        endLineNumber: startLineNumber,
        endColumn: line.length
      });
    }
    if (superblock) {
      markers.push({
        severity: severity.Error,
        message: "缺少匹配的 '}}'",
        ...superblock
      });
    }
    editor.setModelMarkers(model, "wiki-check", markers);
  }
  const tokensProvider = {
    defaultToken: "invalid",
    tokenPostfix: ".wiki",
    brackets: [
      { open: "{", close: "}", token: "delimiter.bracket" },
      { open: "[", close: "]", token: "delimiter.square" },
      { open: "{{", close: "}}", token: "delimiter.doubleCurly" }
    ],
    keywords: ["Infobox"],
    operators: ["="],
    prefix: /Infobox/,
    nbstr: /[^|]+?/,
    nsstr: /[^\s]+?/,
    str: /.+?/,
    all: /.*?/,
    W: /\s+/,
    w: /\s*/,
    tokenizer: {
      root: [
        [
          /({{)(@prefix)(@W?)(@nsstr?)(@w)$/,
          [
            "delimiter.bracket",
            { token: "keyword", next: "@superblock" },
            "",
            "type.identifier",
            ""
          ]
        ],
        [/.*/, "invalid"]
      ],
      superblock: [
        [/^@w(}})@w$/, "delimiter.bracket", "@pop"],
        [
          /^(@w)(\|)(@w)(@str?)(@w)(=)(@w)(@all)(@w)$/,
          [
            "",
            "delimiter",
            "",
            "identifier",
            "",
            "operator.symbol",
            "",
            {
              cases: {
                "{": { token: "delimiter.curly", next: "@array" },
                "@default": { token: "string.unquoted" }
              }
            },
            ""
          ]
        ],
        [/.*/, "invalid"]
      ],
      array: [
        [/^@w(})@w$/, "delimiter.curly", "@pop"],
        [/^(@w)(\[)(@w)(\])(@w)$/, ["", "delimiter.square", "", "delimiter.square", ""]],
        [
          /^(@w)(\[)(@w)(@nbstr?)(@w)(\])(@w)$/,
          ["", "delimiter.square", "", "string.unquoted", "", "delimiter.square", ""]
        ],
        [
          /^(@w)(\[)(@w)(@nbstr?)(@w)(\|)(@w)(\])(@w)$/,
          [
            "",
            "delimiter.square",
            "",
            "identifier",
            "",
            "delimiter.squarekey",
            "",
            "delimiter.square",
            ""
          ]
        ],
        [
          /^(@w)(\[)(@w)(@nbstr?)(@w)(\|)(@w)(@str?)(@w)(\])(@w)$/,
          [
            "",
            "delimiter.square",
            "",
            "identifier",
            "",
            "delimiter.squarekey",
            "",
            "string.unquoted",
            "",
            "delimiter.square",
            ""
          ]
        ],
        [/.*/, "invalid"]
      ]
    }
  };
  const lightTheme = {
    base: "vs",
    inherit: true,
    colors: {},
    rules: [
      { token: "delimiter.bracket", foreground: "#ca565f" },
      { token: "keyword", foreground: "#ca565f" },
      { token: "delimiter", foreground: "#004dc0" },
      { token: "operator", foreground: "#004dc0" },
      { token: "type.identifier", foreground: "#2dabff" },
      { token: "identifier", foreground: "#7839af" },
      { token: "string", foreground: "#339900" }
    ]
  };
  const darkTheme = {
    base: "vs-dark",
    inherit: true,
    colors: {},
    rules: [
      { token: "delimiter.bracket", foreground: "#f09199" },
      { token: "keyword", foreground: "#f09199" },
      { token: "delimiter", foreground: "#7bb0ff" },
      { token: "operator", foreground: "#7bb0ff" },
      { token: "type.identifier", foreground: "#aaddff" },
      { token: "identifier", foreground: "#ca9ce6" },
      { token: "string", foreground: "#a9d861" }
    ]
  };
  const themes = {
    light: lightTheme,
    dark: darkTheme
  };
  const completionProvider = {
    provideCompletionItems: (model, position) => {
      var word = model.getWordUntilPosition(position);
      var range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      var suggestions = [
        {
          label: "wiki",
          kind: monaco().languages.CompletionItemKind.Snippet,
          insertText: ["{{Infobox $1", "|$2=$3", "}}"].join("\n"),
          insertTextRules: monaco().languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Wiki Block",
          range
        }
      ];
      return { suggestions };
    }
  };
  const languageConfiguration = {
    folding: {
      markers: { start: /{/, end: /}/ }
    }
  };
  function create(element, init, onChange) {
    const WIKI = "bangumi-wiki";
    const LIGHT = WIKI;
    const DARK = WIKI + "-dark";
    const m = monaco();
    m.languages.register({ id: WIKI });
    m.languages.setMonarchTokensProvider(WIKI, tokensProvider);
    m.editor.defineTheme(LIGHT, themes.light);
    m.editor.defineTheme(DARK, themes.dark);
    m.languages.registerCompletionItemProvider(WIKI, completionProvider);
    m.languages.setLanguageConfiguration(WIKI, languageConfiguration);
    const uri = m.Uri.parse("inmemory://infobox.wiki");
    const model = m.editor.createModel(init, WIKI, uri);
    const editor = m.editor.create(element, {
      theme: config.isDark ? DARK : LIGHT,
      language: WIKI,
      model,
      automaticLayout: true,
      lineNumbers: config.showLineNumber ? "on" : "off",
      wordWrap: config.wordWrap ? "on" : "off",
      minimap: {
        enabled: config.showMiniMap,
        showRegionSectionHeaders: false
      }
    });
    validate(model);
    model.onDidChangeContent(() => {
      validate(model);
      onChange?.(model.getValue());
    });
    config.on("showLineNumber", (value) => {
      editor.updateOptions({ lineNumbers: value ? "on" : "off" });
    });
    config.on("showMiniMap", (value) => {
      editor.updateOptions({
        minimap: { enabled: value, showRegionSectionHeaders: false }
      });
    });
    config.on("wordWrap", (value) => {
      editor.updateOptions({ wordWrap: value ? "on" : "off" });
    });
    config.on("isDark", (value) => {
      editor.updateOptions({ theme: value ? DARK : LIGHT });
    });
    return (value) => {
      let old = model.getValue();
      if (old === value) return;
      model.setValue(value);
    };
  }
  const css = '.wiki-enhance-editor+#subject_infobox,.wiki-enhance-editor+#subject_summary{display:none!important}.wiki-enhance-editor{display:flex;flex-direction:row;.wiki-enhance-editor-container{width:100%;height:300px}.wiki-enhance-editor-resize{height:300px;resize:vertical;overflow:auto;width:5px}}html[data-theme=dark]{--c-v-sw-off: #6e6e6e}html{--c-v-sw-off: #dddddd}.wiki-enhance-editor-settings{ul{display:flex;flex-direction:column;list-style-type:none;margin:0 10px;font-weight:700;li{display:flex;flex-direction:row;justify-content:space-between;align-items:center;justify-items:center}}.v-custom-switch{--sw-size: 20px;display:inline-block;input[type=checkbox]{display:none}label{display:inline-block;position:relative;cursor:pointer;border-radius:var(--sw-size);height:var(--sw-size);width:calc(calc(var(--sw-size) - 2px) * 2);background-color:var(--c-v-sw-off);transition:all .3s ease-in-out}label:after{content:"";display:block;position:absolute;pointer-events:none;height:calc(var(--sw-size) - 4px);width:calc(var(--sw-size) - 4px);top:2px;left:2px;border-radius:100%;background-color:#fff;transition:all .3s ease-in-out}input[type=checkbox]:checked+label{background-color:var(--primary-color)}input[type=checkbox]:checked+label:after{left:calc(var(--sw-size) - 2px)}}}';
  async function main() {
    const element = document.querySelector("#subject_infobox") ?? document.querySelector("#subject_summary");
    if (!element) return;
    const options = [
      {
        label: "显示行号",
        key: "showLineNumber",
        get: () => config.showLineNumber,
        set: (v) => config.showLineNumber = v
      },
      {
        label: "显示MiniMap",
        key: "showMiniMap",
        get: () => config.showMiniMap,
        set: (v) => config.showMiniMap = v
      },
      {
        label: "自动折行",
        key: "wordWrap",
        get: () => config.wordWrap,
        set: (v) => config.wordWrap = v
      }
    ];
    chiiLib.ukagaka.addPanelTab({
      tab: "wiki-enhance-editor",
      label: "维基编辑器",
      type: "custom",
      customContent: () => `<div class="wiki-enhance-editor-settings">
                <ul>${options.map(
      (option) => `
                        <li class="widget-item">
                            <div>${option.label}</div>
                            <div class="v-custom-switch">
                                <input
                                    id="wiki-enhance-editor-${option.key}"
                                    type="checkbox"
                                    name="${option.key}"
                                    ${option.get() ? "checked" : ""}
                                >
                                <label for="wiki-enhance-editor-${option.key}"></label>
                            </div>
                        </li>`
    ).join("")}
                </ul>
            </div>`,
      onInit: (_, $el) => {
        for (const option of options) {
          const input = $el.find(`#wiki-enhance-editor-${option.key}`);
          input.on("change", (e) => option.set(e.target.checked));
        }
      }
    });
    await load("https://cdn.jsdelivr.net/npm/monaco-editor/min/");
    addStyle(css);
    const container = create$1("div", { class: "wiki-enhance-editor-container" });
    const resize = create$1("div", { class: "wiki-enhance-editor-resize" });
    const editor = create$1("div", { class: "wiki-enhance-editor" }, container, resize);
    const obStyle = {
      attributes: true,
      attributeFilter: ["style"],
      attributeOldValue: true,
      childList: false,
      characterData: false,
      subtree: false,
      characterDataOldValue: false
    };
    new MutationObserver(() => {
      container.style.height = resize.style.height;
    }).observe(resize, obStyle);
    element.parentElement.insertBefore(editor, element);
    editor.style.display = element.getAttribute("style")?.includes("display: none") ? "none" : "flex";
    let update = create(container, element.value, (value) => {
      if (element.value === value) return;
      element.value = value;
    });
    new MutationObserver((mutations) => {
      let oldValue = mutations[0].oldValue;
      if (oldValue?.includes("display: none")) {
        editor.style.display = "flex";
        update(element.value);
      } else {
        editor.style.display = "none";
      }
    }).observe(element, obStyle);
  }
  main();

})();