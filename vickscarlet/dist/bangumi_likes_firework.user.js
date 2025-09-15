// ==UserScript==
// @name         Bangumi 打上贴贴
// @namespace    b38.dev
// @version      1.0.2
// @author       神戸小鳥 @vickscarlet
// @description  Bangumi 打上贴贴，让贴贴有趣起来
// @license      MIT
// @icon         https://bgm.tv/img/favicon.ico
// @homepage     https://github.com/bangumi/scripts/blob/master/vickscarlet/scripts/likes_firework
// @match        *://bgm.tv/*
// @match        *://chii.in/*
// @match        *://bangumi.tv/*
// ==/UserScript==

(function () {
  'use strict';

  (() => {
    chiiLib.ukagaka.addGeneralConfig({
      title: "打上贴贴",
      name: "likes-firework-autoplay",
      type: "radio",
      defaultValue: "yes",
      getCurrentValue: () => localStorage.getItem("likes-firework-autoplay") || "yes",
      onChange: (value) => localStorage.setItem("likes-firework-autoplay", value),
      options: [
        { value: "yes", label: "自动播放" },
        { value: "no", label: "不自动播放" }
      ]
    });
    const likes = Array.from(
      document.querySelectorAll("#columnInSubjectA > .clearit .likes_grid a.item")
    ).map((e) => {
      const url = e.querySelector(".emoji").style.backgroundImage.split('"')[1];
      const count = Number(e.querySelector(".num").innerText);
      return [url, count];
    });
    if (!likes.length) return;
    const rand = (min, max) => ~~(Math.random() * (max - min + 1) + min);
    const displacement = (v0, a, t) => v0 * t + a * t * t / 2;
    class Launch {
      start;
      target;
      current;
      hue;
      end;
      xy;
      total;
      hitX = false;
      hitY = false;
      speed = 2;
      lineWidth = 1;
      brightness = rand(50, 80);
      alpha = rand(50, 100) / 100;
      targetRadius = 1;
      acceleration = 4 / 100;
      time = Date.now();
      constructor({ start, target, hue, end }) {
        this.start = Array.from(start);
        this.target = Array.from(target);
        this.current = Array.from(this.start);
        this.hue = hue;
        this.end = end;
        const angle = Math.atan2(target[1] - start[1], target[0] - start[0]);
        this.xy = [Math.cos(angle), Math.sin(angle)];
        this.total = Math.sqrt((target[0] - start[0]) ** 2 + (target[1] - start[1]) ** 2);
      }
      update(ctx, _) {
        const dt = (Date.now() - this.time) / 4;
        const s = displacement(this.speed, this.acceleration, dt);
        if (s > this.total) return this.end();
        const last = this.current;
        this.current = [this.start[0] + s * this.xy[0], this.start[1] + s * this.xy[1]];
        ctx.beginPath();
        ctx.moveTo(Math.round(last[0]), Math.round(last[1]));
        ctx.lineTo(Math.round(this.current[0]), Math.round(this.current[1]));
        ctx.closePath();
        ctx.strokeStyle = "hsla(" + this.hue + ", 100%, " + this.brightness + "%, " + this.alpha + ")";
        ctx.stroke();
      }
    }
    class Explosion {
      center;
      hue;
      url;
      endCallback;
      particles = /* @__PURE__ */ new Set();
      like;
      total = rand(30, 45);
      _done = false;
      _dp = false;
      _dl = false;
      constructor({ center, hue, url, end }) {
        this.center = Array.from(center);
        this.hue = hue;
        this.url = url;
        this.endCallback = end;
        let count = this.total;
        while (count--) {
          const particle = new Particle({
            center,
            hue,
            end: () => {
              this.particles.delete(particle);
              if (!this.particles.size) {
                this._dp = true;
                if (this._dl) this.end();
              }
            }
          });
          this.particles.add(particle);
        }
        this.like = new Like({
          url: this.url,
          center: this.center,
          end: () => {
            this._dl = true;
            if (this._dp) this.end();
          }
        });
      }
      update(ctx, dt) {
        if (this._done) return this;
        for (const particle of this.particles) {
          particle.update(ctx, dt);
        }
        this.like.update(ctx, dt);
      }
      end() {
        this._done = true;
        this.endCallback();
      }
    }
    class Like {
      center;
      url;
      end;
      size = 21;
      pixel = 0.5;
      gap = 1;
      alpha = 1;
      max = rand(3, 4);
      speed = 10 / (this.max - 1);
      constructor({ center, url, end }) {
        this.center = Array.from(center);
        this.url = url;
        this.end = end;
      }
      update(ctx, dt) {
        if (this.gap < this.max) {
          this.gap += dt / this.speed;
          this.pixel += dt / this.speed / 2.2;
        }
        this.alpha *= 0.85;
        if (this.alpha < 1e-5) {
          return this.end();
        }
        const data = Like.get(this.url);
        const [cx, cy] = this.center;
        for (let h = 0; h < this.size; h++) {
          for (let w = 0; w < this.size; w++) {
            ctx.beginPath();
            ctx.arc(
              cx + (w - 11) * this.gap,
              cy + (h - 11) * this.gap,
              this.pixel,
              0,
              Math.PI * 2,
              false
            );
            const [r, g, b, a] = data[h * this.size + w];
            const alpha = a * this.alpha;
            ctx.closePath();
            ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha * 0.1 + ")";
            ctx.fill();
          }
        }
      }
      static data = /* @__PURE__ */ new Map();
      static async init(urls) {
        for (const url of urls) {
          if (this.data.has(url)) continue;
          const data = await this.loading(url);
          this.data.set(url, data);
        }
      }
      static async loading(url) {
        return new Promise((reslove) => {
          const img = new Image();
          img.src = url;
          img.onload = function() {
            let imgWidth = 21;
            let imgHeight = 21;
            const c = document.createElement("canvas");
            c.width = 21;
            c.height = 21;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            let imgData = ctx.getImageData(0, 0, imgWidth, imgHeight);
            const datas = [];
            for (let h = 0; h < imgHeight; h += 1) {
              for (let w = 0; w < imgWidth; w += 1) {
                let position = (imgWidth * h + w) * 4;
                let r = imgData.data[position], g = imgData.data[position + 1], b = imgData.data[position + 2], a = imgData.data[position + 3];
                datas.push([r, g, b, a]);
              }
            }
            reslove(datas);
          };
        });
      }
      static get(url) {
        return this.data.get(url);
      }
    }
    class Particle {
      x;
      y;
      hue;
      end;
      angle = rand(0, 360);
      speed = rand(1, 15);
      brightness = rand(50, 80);
      alpha = rand(40, 100) / 100;
      decay = rand(10, 50) / 1e3;
      wind = rand(-100, 100) / 100;
      partSpeedVariance = 10;
      gravity = 1 / 2;
      friction = 1 - 5 / 100;
      hueVariance = 30;
      lineWidth = 1;
      flickerDensity = 20;
      constructor({ center, hue, end }) {
        [this.x, this.y] = center;
        this.hue = rand(hue - this.hueVariance, hue + this.hueVariance);
        this.end = end;
      }
      update(ctx, dt) {
        let radians = this.angle * Math.PI / 180;
        let vx = Math.cos(radians) * this.speed;
        let vy = Math.sin(radians) * this.speed + this.gravity;
        this.speed *= this.friction;
        const { x, y } = this;
        this.x += vx * dt;
        this.y += vy * dt;
        this.angle += this.wind;
        this.alpha -= this.decay;
        if (this.alpha < 0.05) {
          this.end();
          return;
        }
        ctx.beginPath();
        ctx.moveTo(Math.round(x), Math.round(y));
        ctx.lineTo(Math.round(this.x), Math.round(this.y));
        ctx.closePath();
        ctx.strokeStyle = "hsla(" + this.hue + ", 100%, " + this.brightness + "%, " + this.alpha + ")";
        ctx.stroke();
        let inverseDensity = 50 - this.flickerDensity;
        if (rand(0, inverseDensity) === inverseDensity) {
          ctx.beginPath();
          ctx.arc(
            Math.round(this.x),
            Math.round(this.y),
            rand(this.lineWidth, this.lineWidth + 3) / 2,
            0,
            Math.PI * 2,
            false
          );
          ctx.closePath();
          let randAlpha = rand(50, 100) / 100;
          ctx.fillStyle = "hsla(" + this.hue + ", 100%, " + this.brightness + "%, " + randAlpha + ")";
          ctx.fill();
        }
      }
    }
    class Firework {
      url;
      start;
      target;
      endCallback;
      state = { type: "idle" };
      hue = rand(0, 360);
      constructor({ url, start, target, end }) {
        this.url = url;
        this.start = Array.from(start);
        this.target = Array.from(target);
        this.endCallback = end;
      }
      update(ctx, dt) {
        switch (this.state.type) {
          case "launch":
          case "explosion":
            this.state.item.update(ctx, dt);
            break;
        }
        return this;
      }
      launch() {
        this.state = {
          type: "launch",
          item: new Launch({
            start: this.start,
            target: this.target,
            hue: this.hue,
            end: () => this.explosion()
          })
        };
        return this;
      }
      explosion() {
        this.state = {
          type: "explosion",
          item: new Explosion({
            url: this.url,
            center: this.target,
            hue: this.hue,
            end: () => this.end()
          })
        };
        return this;
      }
      end() {
        this.state = { type: "end" };
        this.endCallback();
        return this;
      }
    }
    class Fireworks {
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas = document.createElement("canvas");
      ctx = this.canvas.getContext("2d");
      fireworks = /* @__PURE__ */ new Set();
      _loop = false;
      time = Date.now();
      timeout = 0;
      constructor() {
        const actions = document.querySelector(
          "#columnInSubjectA > .clearit .topic_actions .post_actions"
        );
        const btn = document.createElement("div");
        btn.classList.add("action");
        const a = document.createElement("a");
        a.classList.add("icon");
        a.href = "javascript:void(0)";
        const span = document.createElement("span");
        span.classList.add("title");
        span.appendChild(document.createTextNode("🎇 打上贴贴"));
        a.append(span);
        btn.append(a);
        actions?.prepend(btn);
        btn.addEventListener("click", () => this.init(likes));
        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.width = "100vw";
        this.canvas.style.height = "100vh";
        this.canvas.style.pointerEvents = "none";
        this.canvas.style.zIndex = "999999";
        this.canvas.style.transition = "opacity 1s";
        this.canvas.width = this.cw;
        this.canvas.height = this.ch;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        document.body.append(this.canvas);
        window.addEventListener("resize", () => {
          this.cw = window.innerWidth;
          this.ch = window.innerHeight;
          this.canvas.width = this.cw;
          this.canvas.height = this.ch;
        });
      }
      async init(likes2) {
        await Like.init(likes2.map(([url]) => url));
        likes2.map(([url, count]) => new Array(count).fill(url)).flat().sort(() => rand(-10, 10)).forEach((url, i) => {
          setTimeout(() => {
            this.launch(url);
          }, Math.min(rand(50, 150) * i, 2e4));
        });
      }
      launch(url) {
        const target = [rand(50, this.cw - 50), rand(50, this.ch / 2) - 50];
        const dx = rand(30, 200);
        const firework = new Firework({
          url,
          start: [target[0] > this.cw / 2 ? target[0] - dx : target[0] + dx, this.ch],
          target,
          end: () => {
            this.fireworks.delete(firework);
            if (!this.fireworks.size) {
              clearTimeout(this.timeout);
              this.timeout = setTimeout(() => {
                this.canvas.style.opacity = "0";
                this._loop = false;
              }, 1e3);
            }
          }
        });
        this.fireworks.add(firework);
        firework.launch();
        if (this.fireworks.size < 1) return;
        clearTimeout(this.timeout);
        if (this._loop) return;
        this.canvas.style.opacity = "1";
        this._loop = true;
        this.time = Date.now();
        this.loop();
      }
      loop() {
        if (!this._loop) return;
        requestAnimationFrame(() => this.loop());
        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.fillStyle = "rgba(0,0,0,.25)";
        this.ctx.fillRect(0, 0, this.cw, this.ch);
        this.ctx.globalCompositeOperation = "lighter";
        let now = Date.now();
        let dt = (now - this.time) / 16;
        dt = dt > 5 ? 5 : dt;
        this.time = now;
        for (const firework of this.fireworks) firework.update(this.ctx, dt);
      }
    }
    const fireworks = new Fireworks();
    if (localStorage.getItem("likes-firework-autoplay") == "no") return;
    fireworks.init(likes);
  })();

})();