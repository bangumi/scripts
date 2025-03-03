/**merge:js=_common.dom.utils.js**//**merge**/
async function waitElement(parent, id, timeout = 1000) {
    return new Promise((resolve, reject) => {
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

        const node = parent.getElementById(id);
        if (node) return done(() => {
            observer.disconnect();
            resolve(node);
        });

        setTimeout(() => done(() => {
            observer.disconnect();
            const node = parent.getElementById(id);
            if (node) resolve(node);
            else reject();
        }), timeout);
    });
}