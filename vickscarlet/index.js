class UserPanel {
    static #bfbgi(src) {
        const randomClass = 'v-rand-' + Math.floor(Math.random() * 100000 + 100000).toString(16);
        this.#style.innerText = `.${randomClass}::before {background-image: url("${src}");}`;
        return randomClass;
    }
    
    static async show(id) {
        window.addEventListener('resize', this.#resize.bind(this));
        this.#id = id;
        this.#isShow = true;
        const avatar = create('div', { class: ['avatar', 'board', 'loading'] });
        const bio = create('fieldset', { class: ['bio', 'board', 'loading'] }, [
            'legend',
            SvgIcon.user(),
            'Bio',
        ]);
        const usedname = create(
            'fieldset',
            { class: ['usedname', 'board', 'loading', 'tags-field'] },
            ['legend', SvgIcon.history(), '曾用名']
        );
        const tags = create(
            'fieldset',
            { class: ['tags', 'board', 'loading', 'editable', 'tags-field'] },
            ['legend', SvgIcon.tag(), '标签']
        );
        const note = create('fieldset', { class: ['note', 'board', 'loading', 'editable'] }, [
            'legend',
            SvgIcon.note(),
            '备注',
        ]);
        const stats = create('ul', { class: ['stats', 'board', 'loading'] });
        const chart = create('ul', { class: ['chart', 'board', 'loading'] });

        const homeBtn = create(
            'li',
            { class: ['home', 'svg-icon'], onClick: () => newTab('/user/' + id) },
            SvgIcon.home(),
            ['span', '主页']
        );
        const pmBtn = create('li', { class: ['pm', 'svg-icon'] }, SvgIcon.message(), [
            'span',
            '私信',
        ]);
        const connectBtn = create('li', { class: ['friend', 'svg-icon'] }, SvgIcon.connect(), [
            'span',
            '加好友',
        ]);
        const disconnectBtn = create(
            'li',
            { class: ['friend', 'svg-icon'] },
            SvgIcon.disconnect(),
            ['span', '解除好友']
        );
        const blockedBtn = create('li', { class: ['block', 'svg-icon'] }, SvgIcon.block(), [
            'span',
            '解除屏蔽',
        ]);
        const unblockBtn = create('li', { class: ['block', 'svg-icon'] }, SvgIcon.notify(), [
            'span',
            '屏蔽',
        ]);
        const actions = create(
            'ul',
            { class: ['actions', 'board'] },
            homeBtn,
            pmBtn,
            connectBtn,
            unblockBtn
        );

        const container = create(
            'div',
            { class: 'container' },
            avatar,
            actions,
            stats,
            chart,
            note,
            usedname,
            tags,
            bio
        );
        append(document.body, [this.#panel, container]);
        this.#niceIt(container);
        await Promise.all(
            [
                async () => {
                    // 头像、昵称、简介、统计、图表、PM
                    const homepage = await User.homepage(id);
                    if (!this.#isShow || id != this.#id) return;
                    avatar.classList.remove('loading');
                    bio.classList.remove('loading');
                    stats.classList.remove('loading');
                    chart.classList.remove('loading');
                    if (!homepage) {
                        avatar.classList.add('failed');
                        bio.classList.add('failed');
                    }
                    const {
                        type,
                        name,
                        src,
                        friend,
                        nid,
                        gh,
                        bio: rbio,
                        stats: sts,
                        chart: cht,
                    } = homepage;
                    bio.classList.add(this.#bfbgi(src));
                    append(avatar, ['img', { src }], createTextSVG(name, 'vc-serif'), ['span', id]);
                    append(bio, rbio);
                    if (rbio) this.#niceIt(rbio);
                    append(
                        stats,
                        ...map(sts, (v) => [
                            'li',
                            { class: ['stat', 'tip-item', v.type] },
                            ['div', v.value],
                            ['span', v.name],
                        ])
                    );
                    const max = Math.max(...cht.map((v) => v.value));
                    append(
                        chart,
                        ...map(cht, (v) => [
                            'li',
                            { class: 'tip-item' },
                            ['span', `${v.label}分: ${v.value}`],
                            [
                                'div',
                                {
                                    class: 'bar',
                                    style: { width: ((v.value / max) * 100).toFixed(2) + '%' },
                                },
                            ],
                        ])
                    );
                    this.#resize();
                    switch (type) {
                        case 'guest': {
                            const act = () =>
                                confirm('暂未登录，是否打开登录页面') && newTab('/login');
                            pmBtn.addEventListener('click', act);
                            connectBtn.addEventListener('click', act);
                            break;
                        }
                        case 'self': {
                            const act = () => alert('这是自己');
                            pmBtn.addEventListener('click', act);
                            connectBtn.addEventListener('click', act);
                            break;
                        }
                        case 'friend':
                            connectBtn.replaceWith(disconnectBtn);
                        default:
                            pmBtn.addEventListener('click', () =>
                                newTab('/pm/compose/' + nid + '.chii')
                            );
                            if (friend) connectBtn.replaceWith(disconnectBtn);
                            connectBtn.addEventListener('click', async () => {
                                if (await User.connect(nid, gh))
                                    connectBtn.replaceWith(disconnectBtn);
                            });
                            disconnectBtn.addEventListener('click', async () => {
                                if (await User.disconnect(nid, gh))
                                    disconnectBtn.replaceWith(connectBtn);
                            });
                    }
                },
                async () => {
                    // 曾用名
                    const names = await User.usednames(id);
                    if (!this.#isShow || id != this.#id) return;
                    usedname.classList.remove('loading');
                    const usednameUl = create('ul', ...map(names, (v) => ['li', v]));
                    append(usedname, usednameUl);
                    this.#niceIt(usednameUl);
                    this.#resize();
                },
                async () => {
                    // 屏蔽按钮
                    const blocked = await User.isBlocked(id);
                    if (!this.#isShow || id != this.#id) return;
                    if (blocked) unblockBtn.replaceWith(blockedBtn);
                    blockedBtn.addEventListener('click', async () => {
                        if (await User.unblock(id)) blockedBtn.replaceWith(unblockBtn);
                    });
                    unblockBtn.addEventListener('click', async () => {
                        if (await User.block(id)) unblockBtn.replaceWith(blockedBtn);
                    });
                    this.#resize();
                },
                async () => {
                    // 标签
                    const e = tags;
                    const edit = create(
                        'div',
                        { class: ['svg-icon', 'action', 'normal'] },
                        SvgIcon.edit(),
                        ['span', '编辑']
                    );
                    const ok = create(
                        'div',
                        { class: ['svg-icon', 'action', 'edit'] },
                        SvgIcon.ok(),
                        ['span', '保存']
                    );
                    const close = create(
                        'div',
                        { class: ['svg-icon', 'action', 'edit'] },
                        SvgIcon.close(),
                        ['span', '取消']
                    );
                    const content = create('ul', { class: 'normal' });
                    const textarea = create('textarea', { class: 'edit' });
                    const wrapper = create('div', { class: 'wrapper' }, content, textarea);
                    const actions = create('div', { class: ['actions'] }, edit, ok, close);
                    append(e, wrapper, actions);
                    this.#niceIt(content);
                    this.#niceIt(textarea);
                    const render = async (save = false, value) => {
                        removeAllChildren(content);
                        e.classList.add('loading');
                        e.classList.remove('editing');
                        const tags = save
                            ? await User.setTags(
                                  id,
                                  value.split('\n').map((tag) => tag.trim())
                              )
                            : await User.getTags(id);
                        if (!this.#isShow || id != this.#id) return;
                        e.classList.remove('loading');
                        append(content, ...map(tags, (tag) => ['li', tag]));
                        this.#resize();
                    };
                    edit.addEventListener('click', () => {
                        e.classList.add('editing');
                        textarea.value = Array.from(content.children, (e) => e.innerText).join(
                            '\n'
                        );
                        textarea.focus();
                        textarea.setSelectionRange(0, 0);
                        NiceScroll.to(textarea, { x: 0, y: 0 });
                    });
                    ok.addEventListener('click', () => render(true, textarea.value));
                    close.addEventListener('click', () => render());
                    await render();
                },
                async () => {
                    // 备注
                    const e = note;
                    const edit = create(
                        'div',
                        { class: ['svg-icon', 'action', 'normal'] },
                        SvgIcon.edit(),
                        ['span', '编辑']
                    );
                    const ok = create(
                        'div',
                        { class: ['svg-icon', 'action', 'edit'] },
                        SvgIcon.ok(),
                        ['span', '保存']
                    );
                    const close = create(
                        'div',
                        { class: ['svg-icon', 'action', 'edit'] },
                        SvgIcon.close(),
                        ['span', '取消']
                    );
                    const content = create('div', { class: 'normal' }, ['span']);
                    const textarea = create('textarea', { class: 'edit' });
                    const wrapper = create('div', { class: 'wrapper' }, content, textarea);
                    const actions = create('div', { class: ['actions'] }, edit, ok, close);
                    append(e, wrapper, actions);
                    this.#niceIt(content);
                    this.#niceIt(textarea);
                    const render = async (save = false, value = '') => {
                        removeAllChildren(content);
                        e.classList.add('loading');
                        e.classList.remove('editing');
                        const note = save ? await User.setNote(id, value) : await User.getNote(id);
                        if (!this.#isShow || id != this.#id) return;
                        e.classList.remove('loading');
                        append(content, ['span', note ?? '']);
                        this.#resize();
                    };
                    edit.addEventListener('click', () => {
                        e.classList.add('editing');
                        textarea.value = content.innerText;
                        textarea.focus();
                        textarea.setSelectionRange(0, 0);
                        NiceScroll.to(textarea, { x: 0, y: 0 });
                    });
                    ok.addEventListener('click', () => render(true, textarea.value));
                    close.addEventListener('click', () => render());
                    await render();
                },
            ].map((fn) => fn())
        );
    }
}

const router = new Router().use({
    pattern: '/',
    handler: debug('首页'),
    children: [
        {
            pattern: '/group',
            handler: debug('我参加的小组的最近话题'),
            children: [
                { pattern: '/all', handler: debug('所有小组') },
                { pattern: '/discover', handler: debug('小组发现(随便看看)') },
                { pattern: '/topic/*', handler: common('小组话题') },
                {
                    pattern: '/*',
                    handler: debug('小组信息'),
                    children: [{ pattern: '/forum', handler: debug('小组帖子列表') }],
                },
            ],
        },
        { pattern: '/subject/topic/*', handler: common('条目讨论') },
        // { pattern: '/character/topic/*', handler: common('人物页面') },
        // { pattern: '/person/topic/*', handler: common('人物页面') },
        { pattern: '/(character|person)/topic/*', handler: common('角色或人物页面') },
        { pattern: '/blog/*', handler: common('日志页面') },
        { pattern: '/ep/*', handler: common('章节吐槽') },
        {
            pattern: '/rakuen',
            handler: common('乐园/超展开'),
            children: [
                { pattern: '/home', handler: common('乐园/首页') },
                { pattern: '/topiclist', handler: common('超展开/列表') },
                // { pattern: '/topic/group/*', handler: common('超展开/小组话题') },
                // { pattern: '/topic/subject/*', handler: common('超展开/条目讨论') },
                // { pattern: '/topic/ep/*', handler: common('超展开/章节吐槽') },
                // { pattern: '/topic/prsn/*', handler: common('超展开/人物评论') },
                // { pattern: '/topic/crt/*', handler: common('超展开/角色评论') },
                {
                    pattern: '/topic/(group|subject|ep|prsn|crt)/*',
                    handler: common('超展开/吐槽、讨论、评论'),
                },
            ],
        },
    ],
});