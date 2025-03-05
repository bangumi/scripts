/**merge:js=_common.router.js**/ /**merge**/
class Router {
    #root = { part: { raw: '', enum: new Set(['']) }, child: [] };

    #parsePart(raw) {
        raw = raw.trim();
        const part = { raw };
        if (raw.at(-1) == ')' && raw.includes('(')) {
            const split = raw.split('(');
            raw = split[0];
            const enums = split[1].replace(')', '').split('|');
            part.enum = new Set(enums.map((s) => s.trim()));
        }
        switch (raw[0]) {
            case ':':
                part.key = raw.slice(1);
            case '*':
                break;
            default:
                if (raw) part.enum = new Set([raw]);
        }
        return part;
    }
    #find({ child }, part) {
        for (const layer of child) if (layer.part.raw === part) return layer;
        return null;
    }

    #deep(layer, parts) {
        for (const part of parts) {
            const findLayer = this.#find(layer, part);
            if (!findLayer) {
                const newLayer = { part: this.#parsePart(part), child: [] };
                layer.child.push(newLayer);
                layer = newLayer;
            } else {
                layer = findLayer;
            }
        }
        return layer;
    }

    #useSingle(layer, pattern, children, handler, fallback) {
        const parts = pattern.trim().split('/');
        if (parts.at(0) === '') parts.shift();
        if (parts.at(-1) === '') parts.pop();
        const child = this.#deep(layer, parts);
        child.handler = handler;
        child.fallback = fallback;
        if (!children) return;
        for (const options of children) this.#use(child, options);
    }

    #use(layer, { pattern, handler, children, fallback }) {
        for (const p of [pattern].flat()) this.#useSingle(layer, p, children, handler, fallback);
    }

    use(options) {
        this.#use(this.#root, options);
        return this;
    }

    #deepMatch(layer, [path, ...paths], params = {}, [...pattern] = []) {
        const { part, child, handler, fallback } = layer;
        pattern.push(part.raw);
        if (part.enum && !part.enum.has(path)) return null;
        if (part.key) params[part.key] = path;
        if (paths.length) {
            for (const c of child) {
                const match = this.#deepMatch(c, paths, params, pattern);
                if (match) return match;
            }
            if (!fallback) return null;
        }
        if (!handler) return null;
        return { handler, params, pattern: pattern.join('/') || '/' };
    }

    #match(path) {
        const parts = path.trim().split('/');
        if (parts.at(-1) == '') parts.pop();
        if (parts.at(0) !== '') parts.unshift('');
        return this.#deepMatch(this.#root, parts);
    }

    active(path) {
        const match = this.#match(path);
        if (!match) return null;
        const { handler, params, pattern } = match;
        return handler(params, path, pattern);
    }
}

/**
 * @test
const router = new Router();
console.time('router');
router
    .use({
        pattern: '/user/:id',
        handler: (params) => console.log('用户页面', params.id),
    })
    .use({
        pattern: '/:type(anime|book|music|game)/tags',
        handler: ({ type }) => console.log('频道标签', type),
    })
    .use({
        pattern: '/:type(anime|book|music|game)/list/:id',
        handler: ({ type, id }, path, pattern) => console.log('用户收藏', type, id, path, pattern),
        children: [
            {
                pattern: '/:subtype',
                handler: ({ type, id, subtype }) => console.log('用户收藏子类', type, id, subtype),
            },
        ],
    })
    .use({
        pattern: '/',
        handler: () => console.log('Home page'),
    });
console.timeEnd('router');

router.active('') // Home page
router.active('/') // Home page
router.active('/user/vickscarlet') // 用户页面 vickscarlet
router.active('/anime/list/vickscarlet') // 用户收藏 anime vickscarlet /anime/list/vickscarlet /:type(anime|book|music|game)/list/:id
router.active('/game/list/vickscarlet/wish') // 用户收藏子类 game vickscarlet wish
*/
