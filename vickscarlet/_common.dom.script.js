/**merge:js=_common.dom.script.js**//**merge**/
/**
 * 加载脚本
 * @param {string} src 脚本链接
 * @returns {Promise<void>}
 */
async function loadScript(src) {
    if (!this._loaded) this._loaded = new Set();
    if (this._loaded.has(src)) return;
    if (!this._pedding) this._pedding = new Map();
    const list = this._pedding.get(src) ?? [];
    const pedding = new Promise(resolve => list.push(resolve));
    if (!this._pedding.has(src)) {
        this._pedding.set(src, list);
        const script = create('script', { src, type: 'text/javascript' });
        script.onload = () => {
            this._loaded.add(src);
            list.forEach(resolve => resolve());
        };
        document.body.appendChild(script);
    }
    return pedding
}