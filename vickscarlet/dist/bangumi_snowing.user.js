// ==UserScript==
// @name         Bangumi 下雪了
// @namespace    b38.dev
// @version      2.0.0
// @author       神戸小鳥 @vickscarlet
// @description  白色雪花与表情共同飘落
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/scripts/snowing
// @match        *://bgm.tv/*
// @match        *://chii.in/*
// @match        *://bangumi.tv/*
// ==/UserScript==

(async function () {
  'use strict';

  const content = '<div id="snowing-config">\r\n    <div class="section" data-type="range" data-param="total">\r\n        <div class="title">粒子数量</div>\r\n        <div class="control">\r\n            <div class="slider">\r\n                <div class="track"></div>\r\n                <div class="range"></div>\r\n                <div class="thumb"></div>\r\n            </div>\r\n            <input type="number">\r\n        </div>\r\n    </div>\r\n\r\n    <div class="section" data-type="range" data-param="ratio">\r\n        <div class="title">表情占比(%)</div>\r\n        <div class="control">\r\n            <div class="slider">\r\n                <div class="track"></div>\r\n                <div class="range"></div>\r\n                <div class="thumb"></div>\r\n            </div>\r\n            <input type="number">\r\n        </div>\r\n    </div>\r\n    <div class="section" data-type="range" data-param="speed">\r\n        <div class="title">下落速度</div>\r\n        <div class="control">\r\n            <div class="slider">\r\n                <div class="track"></div>\r\n                <div class="range"></div>\r\n                <div class="thumb"></div>\r\n            </div>\r\n            <input type="number">\r\n        </div>\r\n    </div>\r\n\r\n    <div class="section" data-type="range" data-param="rot">\r\n        <div class="title">旋转速度</div>\r\n        <div class="control">\r\n            <div class="slider">\r\n                <div class="track"></div>\r\n                <div class="range"></div>\r\n                <div class="thumb"></div>\r\n            </div>\r\n            <input type="number">\r\n        </div>\r\n    </div>\r\n\r\n    <div class="section" data-type="double-range" data-param="snowSize">\r\n        <div class="title">雪花大小</div>\r\n        <div class="control">\r\n            <input type="number" />\r\n            <div class="slider">\r\n                <div class="track"></div>\r\n                <div class="range"></div>\r\n                <div class="thumb"></div>\r\n                <div class="thumb"></div>\r\n            </div>\r\n            <input type="number" />\r\n        </div>\r\n    </div>\r\n\r\n    <div class="section" data-type="double-range" data-param="emojiSize">\r\n        <div class="title">表情大小</div>\r\n        <div class="control">\r\n            <input type="number" />\r\n            <div class="slider">\r\n                <div class="track"></div>\r\n                <div class="range"></div>\r\n                <div class="thumb"></div>\r\n                <div class="thumb"></div>\r\n            </div>\r\n            <input type="number" />\r\n        </div>\r\n    </div>\r\n</div>';
  const style = 'html[data-theme="dark"] {\r\n    #snowing-config {\r\n        --bg-color: #6e6e6e;\r\n        --border-corlor: #8c8c8c;\r\n    }\r\n}\r\n#snowing-config {\r\n    --bg-color: #fefefe;\r\n    --border-corlor: #eee;\r\n    .control {\r\n        display: flex;\r\n        align-items: center;\r\n        gap: 12px;\r\n        input {\r\n            width: 64px;\r\n            flex: 0 0 auto;\r\n        }\r\n        .slider {\r\n            position: relative;\r\n            height: 24px;\r\n            width: 100%;\r\n            cursor: pointer;\r\n            .track {\r\n                position: absolute;\r\n                top: 50%;\r\n                left: 0;\r\n                right: 0;\r\n                height: 4px;\r\n                background: var(--bg-color);\r\n                border-radius: 100px;\r\n                transform: translateY(-50%);\r\n                border: 1px solid var(--border-corlor);\r\n                box-shadow: 0 0 4px rgb(from var(--primary-color,#f09199) r g b / 0.3);\r\n            }\r\n            .range {\r\n                position: absolute;\r\n                top: 50%;\r\n                height: 4px;\r\n                background: var(--primary-color,#f09199);\r\n                border-radius: 100px;\r\n                transform: translateY(-50%);\r\n            }\r\n            .thumb {\r\n                position: absolute;\r\n                top: 50%;\r\n                width: 14px;\r\n                height: 14px;\r\n                background: #fff;\r\n                border: 2px solid var(--primary-color,#f09199);\r\n                border-radius: 50%;\r\n                transform: translate(-50%, -50%);\r\n                cursor: pointer;\r\n                box-sizing: border-box;\r\n            }\r\n            .thumb:hover {\r\n                background: #eef6ff;\r\n            }\r\n        }\r\n    }\r\n}';
  function bindThumb(slider, thumbs, onChange) {
    const rect = () => slider.getBoundingClientRect();
    const isDouble = !!thumbs[1];
    let current = 0;
    const onMove = (e) => {
      const r = rect();
      const x = e.clientX - r.left;
      onChange(x / r.width, current);
    };
    const stop = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", stop);
    };
    slider.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (isDouble) {
        const p0 = thumbs[0].getBoundingClientRect().left + thumbs[0].offsetWidth / 2;
        const p1 = thumbs[1].getBoundingClientRect().left + thumbs[1].offsetWidth / 2;
        current = Math.abs(e.clientX - p0) < Math.abs(e.clientX - p1) ? 0 : 1;
      }
      thumbs[current].setPointerCapture(e.pointerId);
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", stop);
      document.addEventListener("pointercancel", stop);
      onMove(e);
    });
  }
  function setupRange({ item, init: init2, zone, onChange }) {
    let state = init2;
    const number = item.querySelector("input");
    const slider = item.querySelector(".slider");
    const range2 = item.querySelector(".range");
    const thumb = item.querySelector(".thumb");
    const percent = (v) => (v - zone.min) / (zone.max - zone.min) * 100;
    const clamp = (v) => Math.min(zone.max, Math.max(zone.min, v));
    number.min = String(zone.min);
    number.max = String(zone.max);
    range2.style.left = "0";
    const sync = (value) => {
      state = clamp(Math.round(value));
      number.value = String(state);
      range2.style.width = thumb.style.left = `${percent(state)}%`;
      onChange(state);
    };
    bindThumb(slider, [thumb], (v) => sync(v * (zone.max - zone.min) + zone.min));
    number.addEventListener("input", () => sync(Number(number.value)));
    sync(state);
  }
  function setupDoubleRange({ item, init: init2, zone, onChange }) {
    const state = { ...init2 };
    const values = [state.min, state.max];
    const j = () => values[0] > values[1];
    const [minNum, maxNum] = item.querySelectorAll("input");
    const slider = item.querySelector(".slider");
    const rangeEl = item.querySelector(".range");
    const [thumb0, thumb1] = item.querySelectorAll(".thumb");
    const percent = (v) => (v - zone.min) / (zone.max - zone.min) * 100;
    const clamp = (v) => Math.min(zone.max, Math.max(zone.min, v));
    const updateUI = () => {
      const p0 = percent(values[0]);
      const p1 = percent(values[1]);
      thumb0.style.left = `${p0}%`;
      thumb1.style.left = `${p1}%`;
      rangeEl.style.left = `${Math.min(p0, p1)}%`;
      rangeEl.style.width = `${Math.abs(p1 - p0)}%`;
      onChange(state);
    };
    minNum.min = String(zone.min);
    minNum.max = String(zone.max);
    maxNum.min = String(zone.min);
    maxNum.max = String(zone.max);
    const syncMin = (value) => {
      value = clamp(Math.round(value));
      minNum.value = String(value);
      state.min = value;
      if (j()) {
        values[1] = value;
        values[0] = state.max;
      } else {
        values[0] = value;
        values[1] = state.max;
      }
      updateUI();
    };
    const syncMax = (value) => {
      value = clamp(Math.round(value));
      maxNum.value = String(value);
      state.max = value;
      if (j()) {
        values[0] = value;
        values[1] = state.min;
      } else {
        values[1] = value;
        values[0] = state.min;
      }
      updateUI();
    };
    const syncThumb = (pos, value) => {
      values[pos] = clamp(Math.round(value * (zone.max - zone.min) + zone.min));
      state.max = Math.max(values[0], values[1]);
      state.min = Math.min(values[0], values[1]);
      maxNum.value = String(state.max);
      minNum.value = String(state.min);
      updateUI();
    };
    bindThumb(slider, [thumb0, thumb1], (v, pos) => syncThumb(pos, v));
    syncMin(Number(init2.min));
    syncMax(Number(init2.max));
    minNum.addEventListener("input", () => syncMin(Number(minNum.value)));
    maxNum.addEventListener("input", () => syncMax(Number(maxNum.value)));
  }
  const STORAGE_KEY = "snowing-config";
  function loadConfig(init2) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return init2;
    try {
      return JSON.parse(saved);
    } catch {
      return init2;
    }
  }
  function init({ $el, init: init2, zone, onChange }) {
    $el.find(".section").each((_, item) => {
      const key = item.dataset.param;
      const type = item.dataset.type;
      if (!key || !type) return;
      switch (type) {
        case "range":
          return setupRange({
            item,
            init: init2[key],
            zone: zone[key],
            onChange(value) {
              onChange(key, value);
            }
          });
        case "double-range":
          return setupDoubleRange({
            item,
            init: init2[key],
            zone: zone[key],
            onChange(value) {
              onChange(key, value);
            }
          });
      }
    });
  }
  function setup({ init: c, zone, onChange }) {
    const config = loadConfig(c);
    const styleEl = document.createElement("style");
    styleEl.textContent = style;
    document.head.appendChild(styleEl);
    chiiLib.ukagaka.addPanelTab({
      tab: "snowing",
      label: "下雪了",
      type: "custom",
      customContent: () => content,
      onInit: (_, $el) => init({
        $el,
        init: config,
        zone,
        onChange(key, value) {
          config[key] = value;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
          onChange(config, key == "total" || key == "ratio");
        }
      })
    });
    return config;
  }
  const vs = "attribute vec2 a_pos;\r\nattribute float a_id;\r\nattribute float a_type;\r\nattribute float a_texIndex;\r\n\r\nuniform float u_time;\r\nuniform vec2 u_res;\r\nuniform float u_snow_min;\r\nuniform float u_snow_max;\r\nuniform float u_emoji_min;\r\nuniform float u_emoji_max;\r\nuniform float u_rot_speed;\r\nuniform float u_fall_speed;\r\n\r\nvarying vec2 v_uv;\r\nvarying float v_type;\r\nvarying float v_rot;\r\nvarying float v_texIndex;\r\n\r\nfloat rand(float n) {\r\n    return fract(sin(n) * 43758.5453123);\r\n}\r\n\r\nvoid main() {\r\n    float id = floor(a_id);\r\n    float type = a_type;\r\n\r\n    float x = rand(id * 1.3) * u_res.x;\r\n\r\n    float speed = mix(20.0, 60.0, rand(id)) * u_fall_speed;\r\n\r\n    float spawnWindow = u_res.y / speed;\r\n    float birthTime = rand(id * 7.13) * spawnWindow;\r\n\r\n    float t = u_time - birthTime;\r\n\r\n    if (t < 0.0) {\r\n        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);\r\n        return;\r\n    }\r\n\r\n    float y = t * speed;\r\n    y = mod(y, u_res.y + 100.0);\r\n\r\n    float radius = type < 0.5\r\n        ? mix(u_snow_min, u_snow_max, rand(id * 3.14))\r\n        : mix(u_emoji_min, u_emoji_max, rand(id * 3.14));\r\n\r\n    float rot = rand(id) * 6.28318 + u_time * u_rot_speed;\r\n\r\n    vec2 offset = a_pos * radius;\r\n    float c = cos(rot), s = sin(rot);\r\n    vec2 rotated = vec2(\r\n        offset.x * c - offset.y * s,\r\n        offset.x * s + offset.y * c\r\n    );\r\n\r\n    vec2 pos = vec2(x, y) + rotated;\r\n    vec2 clip = pos / u_res * 2.0 - 1.0;\r\n    clip.y *= -1.0;\r\n\r\n    gl_Position = vec4(clip, 0.0, 1.0);\r\n\r\n    v_uv = a_pos * 0.5 + 0.5;\r\n    v_type = type;\r\n    v_rot = rot;\r\n    v_texIndex = a_texIndex;\r\n}";
  const fs = "precision mediump float;\r\nuniform sampler2D u_tex;\r\nuniform float u_cols;\r\n\r\nvarying vec2 v_uv;\r\nvarying float v_type;\r\nvarying float v_rot;\r\nvarying float v_texIndex;\r\n\r\nvoid main() {\r\n    if ( v_type < 0.5 ) {\r\n        vec2 p = v_uv - 0.5;\r\n        float alpha = smoothstep(0.5, 0.0, length(p));\r\n        if( alpha < 0.01 ) discard;\r\n        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);\r\n        return;\r\n    }\r\n\r\n    float col = v_texIndex;\r\n    vec2 uv = v_uv;\r\n    uv.x = (uv.x + col) / u_cols;\r\n    vec4 color = texture2D(u_tex, uv);\r\n    if (color.a < 0.1) discard;\r\n    gl_FragColor = color;\r\n}";
  function range(start, end) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  const INIT = {
    total: 300,
    ratio: 30,
    speed: 50,
    rot: 20,
    snowSize: { min: 1, max: 5 },
    emojiSize: { min: 3, max: 10 }
  };
  const ZONE = {
    total: { min: 0, max: 1e4 },
    ratio: { min: 0, max: 100 },
    speed: { min: 0, max: 100 },
    rot: { min: 0, max: 100 },
    snowSize: { min: 1, max: 30 },
    emojiSize: { min: 1, max: 30 }
  };
  const QUAD = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, -1],
    [1, 1],
    [-1, 1]
  ];
  const EMOJI_URLS = [
    ...range(1, 9).map((n) => `/img/smiles/bgm/0${n}.png`),
    "/img/smiles/bgm/10.png",
    "/img/smiles/bgm/11.gif",
    ...range(12, 22).map((n) => `/img/smiles/bgm/${n}.png`),
    "/img/smiles/bgm/23.gif",
    ...range(24, 32).map((n) => `/img/smiles/tv/0${n - 23}.gif`),
    ...range(33, 125).map((n) => `/img/smiles/tv/${n - 23}.gif`),
    ...range(200, 238).map((n) => `/img/smiles/tv_vs/bgm_${n}.png`),
    "/img/smiles/tv_500/bgm_500.gif",
    "/img/smiles/tv_500/bgm_501.gif",
    ...range(502, 504).map((n) => `/img/smiles/tv_500/bgm_${n}.png`),
    "/img/smiles/tv_500/bgm_505.gif",
    ...range(506, 514).map((n) => `/img/smiles/tv_500/bgm_${n}.png`),
    ...range(515, 519).map((n) => `/img/smiles/tv_500/bgm_${n}.gif`),
    "/img/smiles/tv_500/bgm_520.png",
    ...range(521, 523).map((n) => `/img/smiles/tv_500/bgm_${n}.gif`),
    ...range(524, 529).map((n) => `/img/smiles/tv_500/bgm_${n}.png`)
  ];
  async function loadEmoji(src) {
    return new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => res(img);
      img.onerror = () => res(null);
    });
  }
  async function getEmojiAtlas(emojiUrls, size = 21) {
    const atlas = document.createElement("canvas");
    const ctx = atlas.getContext("2d");
    if (!ctx) return { atlas, count: 0 };
    const imgs = await Promise.all(emojiUrls.map(loadEmoji));
    const valid = imgs.filter(Boolean);
    if (!valid.length) return { atlas, count: 0 };
    atlas.width = size * valid.length;
    atlas.height = size;
    valid.forEach((img, i) => {
      const scale = Math.min(1, size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = i * size + (size - w) * 0.5;
      const y = (size - h) * 0.5;
      ctx.drawImage(img, x, y, w, h);
    });
    return { atlas, count: valid.length };
  }
  function getVertexAttribData(total, ratio, count) {
    const vertices = [];
    const ids = [];
    const types = [];
    const texIndices = [];
    const EC = Math.floor(total * ratio / 100);
    for (let i = 0; i < total; i++) {
      const type = i < EC ? 1 : 0;
      const texIndex = i < EC ? Math.floor(Math.random() * count) : 0;
      for (let j = 0; j < 6; j++) {
        vertices.push(...QUAD[j]);
        ids.push(i);
        types.push(type);
        texIndices.push(texIndex);
      }
    }
    return { vertices, ids, types, texIndices };
  }
  async function main() {
    let rebuild;
    let reconfig;
    let config = setup({
      init: INIT,
      zone: ZONE,
      onChange(newConfig, isRebuild) {
        config = newConfig;
        if (isRebuild) rebuild?.();
        else reconfig?.();
      }
    });
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 9999
    });
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl");
    if (!gl) return;
    const program = gl.createProgram();
    const resize = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const attachShader = (type, src) => {
      const s = gl.createShader(type);
      if (!s) return;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      gl.attachShader(program, s);
    };
    const bufferAttrib = (data, name, size) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    attachShader(gl.VERTEX_SHADER, vs);
    attachShader(gl.FRAGMENT_SHADER, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
    }
    gl.useProgram(program);
    resize();
    addEventListener("resize", resize);
    const { atlas, count } = await getEmojiAtlas(EMOJI_URLS);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(gl.getUniformLocation(program, "u_cols"), count);
    let vertexCount = 0;
    const buildVertices = () => {
      const { vertices, ids, types, texIndices } = getVertexAttribData(
        config.total,
        config.ratio,
        count
      );
      bufferAttrib(vertices, "a_pos", 2);
      bufferAttrib(ids, "a_id", 1);
      bufferAttrib(types, "a_type", 1);
      bufferAttrib(texIndices, "a_texIndex", 1);
      vertexCount = ids.length;
    };
    const setParameters = () => {
      gl.uniform1f(gl.getUniformLocation(program, "u_snow_min"), config.snowSize.min);
      gl.uniform1f(gl.getUniformLocation(program, "u_snow_max"), config.snowSize.max);
      gl.uniform1f(gl.getUniformLocation(program, "u_emoji_min"), config.emojiSize.min);
      gl.uniform1f(gl.getUniformLocation(program, "u_emoji_max"), config.emojiSize.max);
      gl.uniform1f(gl.getUniformLocation(program, "u_fall_speed"), config.speed / 100 + 0.5);
      gl.uniform1f(gl.getUniformLocation(program, "u_rot_speed"), config.rot / 33);
    };
    buildVertices();
    setParameters();
    const start = performance.now();
    const loop = (t) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), (t - start) / 1e3);
      gl.uniform2f(gl.getUniformLocation(program, "u_res"), canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      requestAnimationFrame(loop);
    };
    loop(start);
    rebuild = buildVertices;
    reconfig = setParameters;
  }
  await( main());

})();