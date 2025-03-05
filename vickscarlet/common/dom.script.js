/**merge:js=common/dom.script.js**/ /**merge**/
/**
 * 加载脚本
 * @param {string} src 脚本链接
 * @returns {Promise<void>}
 */
class LoadScript {
    static #loaded = new Set();
    static #pedding = new Map();
    static async load(src) {
        if (this.#loaded.has(src)) return;
        const list = this.#pedding.get(src) ?? [];
        const pedding = new Promise((resolve) => list.push(resolve));
        if (!this.#pedding.has(src)) {
            this.#pedding.set(src, list);
            const script = create('script', { src, type: 'text/javascript' });
            script.onload = () => {
                this.#loaded.add(src);
                list.forEach((resolve) => resolve());
            };
            document.body.appendChild(script);
        }
        return pedding;
    }
}
