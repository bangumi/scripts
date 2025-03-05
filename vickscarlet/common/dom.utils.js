/**merge:js=common/dom.utils.js**/ /**merge**/
async function waitElement(parent, id, timeout = 1000) {
    return new Promise((resolve) => {
        let isDone = false;
        const done = (fn) => {
            if (isDone) return;
            isDone = true;
            fn();
        };
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.id == id) {
                        done(() => {
                            observer.disconnect();
                            resolve(node);
                        });
                        return;
                    }
                }
            }
        });
        observer.observe(parent, { childList: true, subtree: true });

        const node = parent.querySelector('#' + id);
        if (node)
            return done(() => {
                observer.disconnect();
                resolve(node);
            });

        setTimeout(
            () =>
                done(() => {
                    observer.disconnect();
                    resolve(parent.querySelector('#' + id));
                }),
            timeout
        );
    });
}

function observeChildren(element, callback) {
    new MutationObserver((mutations) => {
        for (const mutation of mutations)
            for (const node of mutation.addedNodes)
                if (node.nodeType === Node.ELEMENT_NODE) callback(node);
    }).observe(element, { childList: true });
    for (const child of Array.from(element.children)) callback(child);
}

/**
 * @param {ResizeObserver | IntersectionObserver} Observer
 */
function observerEach(Observer, callback, options) {
    return new Observer((entries) => entries.forEach(callback), options);
}
