/**merge:js=_common.util.js**//**merge**/
/**
 * 返回一个函数，该函数在调用时会等待上一个调用完成后再执行
 * @param {Function} fn
 */
function callWhenDone(fn) {
    let done = true;
    return async () => {
        if (!done) return;
        done = false;
        await fn();
        done = true;
    }
}

/**
 * 立刻调用一次函数并返回函数本体
 * @param {Function} fn
 */
function callNow(fn) {
    fn();
    return fn;
}

/**
 * @template T
 * @template R
 * @param {Iterable<T>} list
 * @param {(item: T, index: number, list: Iterable<T>) => R} fn
 * @param {R[]} ret
 * @return {R[]}
 */
function map(list, fn, ret = []) {
    let i = 0;
    for (const item of list) {
        const result = fn(item, i, list);
        ret.push(result);
        i++;
    }
    return ret
}