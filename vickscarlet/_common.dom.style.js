/**merge:js=_common.dom.style.js**/ /**merge**/
/**
 * @param  {...string} styles
 * @returns {HTMLStyleElement}
 */
function addStyle(...styles) {
    const style = document.createElement('style');
    style.append(document.createTextNode(styles.join('\n')));
    document.head.appendChild(style);
    return style;
}
