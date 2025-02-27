/**merge:js=_common.dom.js**//**merge**/

/**
 * 设置事件监听
 * @typedef {[string, (e:Event)=>void]} Event
 * @param {Element} element 元素
 * @param {Event[]} events 属性
 */
function setEvents(element, events) {
    for (const [event, listener] of events) {
        element.addEventListener(event, listener);
    }
    return element;
}

/**
 * 设置属性
 * @typedef {Record<string, string | number | boolean | Styles>} Props
 * @param {Element} element 元素
 * @param {Props} props 属性
 */
function setProps(element, props) {
    if (!props || typeof props !== 'object') return element;
    const events = [];
    for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'boolean') {
            element[key] = value;
            continue;
        }
        if (key === 'events') {
            if (Array.isArray(value)) {
                events.push(...value);
            } else {
                for (const event in value) {
                    events.push([event, value[event]]);
                }
            }
        } else if (key === 'class') {
            addClass(element, value);
        } else if (key === 'style' && typeof value === 'object') {
            setStyle(element, value);
        } else if (key.startsWith('on')) {
            events.push([key.slice(2).toLowerCase(), value]);
        } else {
            element.setAttribute(key, value);
        }
    }
    setEvents(element, events);
    return element;
}

/**
 * 添加类名
 * @param {Element} element 元素
 * @param {string} value 类名
 */
function addClass(element, value) {
    element.classList.add(...[value].flat());
    return element;
}

/**
 * 设置样式
 * @typedef {Record<string, string | number>} Styles
 * @param {Element} element 元素
 * @param {Styles} styles
 */
function setStyle(element, styles) {
    for (let [k, v] of Object.entries(styles)) {
        if (v && typeof v === 'number' && !['zIndex', 'fontWeight'].includes(k))
            v += 'px';
        element.style[k] = v;
    }
    return element;
}

/**
 * @typedef {[string, Props | AppendParams, ...AppendParams[]]} CreateParams
 * @typedef {CreateParams | string | Element} AppendParams
 */

/**
 * @param {string} name HTML标签
 * @param {Props | AppendParams} props 属性
 * @param {...AppendParams} childrens 子元素
 */
function create(name, props, ...childrens) {
    if (name === 'svg') return createSVG(name, props, ...childrens);
    const element = name instanceof Element ? name : document.createElement(name);
    if (props === undefined) return element;
    if (Array.isArray(props) || props instanceof Node || typeof props !== 'object')
        return append(element, props, ...childrens);
    return append(setProps(element, props), ...childrens);
}

/**
 * @param {Element} element 元素
 * @param {...AppendParams} childrens 子元素
 */
function append(element, ...childrens) {
    if (element.name === 'svg') return appendSVG(element, ...childrens);
    for (const child of childrens) {
        if (Array.isArray(child)) element.append(create(...child));
        else if (child instanceof Node) element.appendChild(child);
        else element.append(document.createTextNode(child));
    }
    return element;
}

/**
 * @param {string} name HTML标签
 * @param {Props | AppendParams} props 属性
 * @param {...AppendParams} childrens 子元素
 */
function createSVG(name, props, ...childrens) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (name === 'svg') element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    if (props === undefined) return element;
    if (Array.isArray(props) || props instanceof Node || typeof props !== 'object')
        return append(element, props, ...childrens);
    return appendSVG(setProps(element, props), ...childrens)
}

/**
 * @param {Element} element 元素
 * @param {...AppendParams} childrens 子元素
 */
function appendSVG(element, ...childrens) {
    for (const child of childrens) {
        if (Array.isArray(child)) element.append(createSVG(...child));
        else if (child instanceof Node) element.appendChild(child);
        else element.append(document.createTextNode(child));
    }
    return element;
}

/**
 * @param {Element} element 元素
 */
function removeAllChildren(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
    return element;
}

/**
 * 创建文本为SVG
 * SVG文本支持自动缩放
 * @param {string|number} text 文本
 */
function createTextSVG(text, fontClass) {
    const testWidthElement = create('span', { class: fontClass, style: { fontSize: '10px', position: 'absolute', opacity: 0 } }, text);
    append(document.body, testWidthElement);
    const w = testWidthElement.offsetWidth;
    testWidthElement.remove();
    return createSVG('svg', { class: fontClass, fill: 'currentColor', viewBox: `0 0 ${w} 10` }, ['text', { 'font-size': 10 }, text]);
}
async function newTab(href) {
    create('a', { href, target: '_blank' }).click();
}