/**
 * 设置事件监听
 * @typedef {[string, (e:Event)=>void]} Event
 * @param {Element} element 元素
 * @param {Event[]} events 属性
 */
export function setEvents(element, events) {
    for (const [event, listener] of events) {
        element.addEventListener(event, listener);
    }
    return element;
}

/**
 * 设置属性
 * @typedef {Record<string, string | number | boolean | Styles | string[]>} Props
 * @param {Element} element 元素
 * @param {Props} props 属性
 */
export function setProps(element, props) {
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
export function addClass(element, value) {
    element.classList.add(...[value].flat());
    return element;
}

/**
 * 设置样式
 * @typedef {Record<string, string | number>} Styles
 * @param {Element} element 元素
 * @param {Styles} styles
 */
export function setStyle(element, styles) {
    for (let [k, v] of Object.entries(styles)) {
        if (v && typeof v === 'number' && !['zIndex', 'fontWeight'].includes(k)) v += 'px';
        element.style[k] = v;
    }
    return element;
}

/**
 * @typedef {[string, Props | AppendParams, ...AppendParams[]]} CreateParams
 * @typedef {CreateParams | string | number | Element | SVGElement} AppendParams
 */

/**
 * @param {string} name HTML标签
 * @param {Props | AppendParams} [props=void 0] 属性
 * @param {...AppendParams} childrens 子元素
 */
export function create(name, props, ...childrens) {
    if (name == null) return null;
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
export function append(element, ...childrens) {
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
export function createSVG(name, props, ...childrens) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (name === 'svg') element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    if (props === undefined) return element;
    if (Array.isArray(props) || props instanceof Node || typeof props !== 'object')
        return append(element, props, ...childrens);
    return appendSVG(setProps(element, props), ...childrens);
}

/**
 * @param {Element} element 元素
 * @param {...AppendParams} childrens 子元素
 */
export function appendSVG(element, ...childrens) {
    for (const child of childrens) {
        if (Array.isArray(child)) element.append(createSVG(...child));
        else if (child instanceof Node) element.appendChild(child);
        else element.append(document.createTextNode(child));
    }
    return element;
}