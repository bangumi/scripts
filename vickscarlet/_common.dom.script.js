/**merge:js=_common.dom.script.js**//**merge**/
/**
 * 加载脚本
 * @param {string} src 脚本链接
 * @returns {Promise<void>}
 */
async function loadScript(src) {
    if (!this._loaded) this._loaded = new Set();
    if (this._loaded.has(src)) return;
    return new Promise(resolve => {
        const script = create('script', { src, type: 'text/javascript' });
        script.onload = () => {
            this._loaded.add(src);
            resolve();
        };
        document.body.appendChild(script);
    })
}