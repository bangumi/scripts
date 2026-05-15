/// <reference types="@types/jquery" />
// chiiLib.d.ts

/* ================================
 * Thickbox (tb_*) globals & helpers
 * ================================ */

declare var tb_pathToImage: string

declare var imgLoader: HTMLImageElement

/** 绑定 thickbox 点击行为 */
declare function tb_init(domChunk: string | Element | JQuery): void

/** 显示 thickbox */
declare function tb_show(caption: string | null, url: string, imageGroup?: string | false): void

/** iframe 加载完毕时显示窗口 */
declare function tb_showIframe(): void

/** 移除 thickbox，返回 false 以阻止默认行为 */
declare function tb_remove(): boolean

/** 根据 TB_WIDTH / TB_HEIGHT 居中定位 */
declare function tb_position(): void

/** 解析 querystring -> 键值对 */
declare function tb_parseQuery(query: string): Record<string, string>

/** 页面可视尺寸 [width, height] */
declare function tb_getPageSize(): [number, number]

/** 是否为 Mac + Firefox */
declare function tb_detectMacXFF(): boolean

/* ======================
 * jQuery Star Rating 插件
 * （根据实际用法推断）
 * ====================== */

declare namespace JQueryStarRating {
    /** rating 交互回调 */
    interface RatingHook {
        (value: number | string, link: HTMLAnchorElement): void
    }

    /** rating 选项（依据示例与常见插件行为） */
    interface RatingOptions {
        /** 获得焦点时 */
        focus?: RatingHook
        /** 失焦时 */
        blur?: RatingHook
        /** 选择后回调（如提交表单） */
        callback?: RatingHook
        /** 是否只读 */
        readOnly?: boolean
        /** 每行显示星数（如有 sprite） */
        split?: number | 0
        /** 单个星宽度（像素） */
        starWidth?: number
        /** 初始标题文本 */
        title?: string
    }

    type RatingMethod =
        | 'enable'
        | 'disable'
        | 'readOnly'
        | 'select'
        | 'drain'
        | 'fill'
        | 'cancel'
        | 'destroy'
}

interface JQuery {
    /**
     * 星级评分
     * 用法示例：
     *   $('.rate').rating({ callback: (v) => { ... } });
     */
    rating(options?: JQueryStarRating.RatingOptions): this
    rating(method: JQueryStarRating.RatingMethod, ...args: unknown[]): this
}

/* ==========================
 * Bootstrap 3.4.1 Tooltip
 * （按源码关键项精简定义）
 * ========================== */

declare namespace BootstrapTooltip {
    type Placement = 'top' | 'bottom' | 'left' | 'right'
    type PlacementFn = (tip: Element, element: Element) => Placement | string

    interface ViewportSpec {
        selector: string | Element | JQuery
        padding: number
    }

    interface DelaySpec {
        show: number
        hide: number
    }

    /** 允许的白名单类型（标签 -> 属性列表/正则） */
    type WhiteList = Record<string, Array<string | RegExp>>

    interface Options {
        animation?: boolean
        placement?: Placement | PlacementFn
        selector?: string | false
        template?: string
        trigger?: string // 'hover focus' 等
        title?: string | (() => string)
        delay?: number | DelaySpec
        html?: boolean
        container?: false | string | Element | JQuery
        viewport?:
            | ViewportSpec
            | string
            | Element
            | JQuery
            | ((this: unknown, $el: JQuery) => string | Element | JQuery)
        /** HTML 清洗相关 */
        sanitize?: boolean
        sanitizeFn?: ((unsafeHtml: string) => string) | null
        whiteList?: WhiteList
    }

    type Method =
        | 'show'
        | 'hide'
        | 'toggle'
        | 'destroy'
        | 'fixTitle'
        | 'enable'
        | 'disable'
        | 'toggleEnabled'
}

interface JQuery {
    tooltip(options?: BootstrapTooltip.Options): this
    tooltip(method: BootstrapTooltip.Method): this
}

/* ================
 * jQuery Share 插件
 * ================ */

declare namespace JQueryShare {
    type PopupModel = 'link' | 'window' | 'dialog' | 'pasteboard'

    /** 常用平台键（允许扩展自定义 key） */
    type BuiltinPlatform =
        | 'kaixin'
        | 'sina'
        | 'renren'
        | 'email'
        | 'douban'
        | 'qq'
        | 'google'
        | 'twitter'
        | 'pasteboard'

    interface DictLinkMap {
        /** 平台名 -> 生成分享 URL（或粘贴板内容）的函数 */
        [platform: string]: (anchor: Element, title: string, content: string, url: string) => string
    }

    interface SharePlaceMap {
        /** 平台名 -> 子元素选择器（如 .share_twitter） */
        [platform: string]: string
    }

    interface Options {
        /** 容器选择器（一般不必传，插件会用当前 jQuery 集合） */
        share?: string
        sharePlace?: SharePlaceMap
        title?: string
        content?: string
        url?: string
        popupModel?: PopupModel
        target?: '_blank' | '_self' | '_parent' | '_top' | string
        dictLink?: DictLinkMap
    }

    /** $.Share 构造器实例（轻量占位） */
    interface Instance {
        /** 换一种写法时保留占位，便于后续扩展 */
        readonly input: JQuery
        readonly options: Options
    }
}

interface JQuery {
    /**
     * 分享按钮绑定
     *   $('.share').share({ popupModel: 'window' })
     */
    share(options?: JQueryShare.Options): this
}

interface JQueryStatic {
    /** 暴露构造器与默认项 */
    Share: {
        new (input: JQuery, options: JQueryShare.Options): JQueryShare.Instance
        defaults: JQueryShare.Options
    }
}

/* ==================
 * @ 提及 suggestBox
 * ================== */

declare namespace JQuerySuggestBox {
    type Mode = 'complete' | 'simple'

    /** 供联想的数据项（根据源码构造） */
    interface SuggestUser {
        uid: string
        nickname: string
        username: string
        /** 用于本地过滤的索引字段（源码里有 user.index） */
        index?: string
    }

    interface Options {
        mode?: Mode // "complete" 默认
        itemCount?: number // 每次最多展示
        /** 拉取远程数据的地址（当 cached=true 且未缓存时使用） */
        dataUrl?: string
        /** 自定义数据（本地模式） */
        customData?: () => SuggestUser[] | null | undefined
        cached?: boolean // 是否缓存远端列表
        highlighter?: string // 高亮容器选择器
        tips?: string // 无数据时提示文本
    }
}

interface JQuery {
    /**
     * 在 textarea/input 上启用 “@用户” 联想
     */
    suggestBox(options?: JQuerySuggestBox.Options): this

    /**
     * 自定义的 "mention" 事件：
     * $(el).trigger('mention', uid, username, highlighterSelector)
     */
    on(
        events: 'mention',
        handler: (event: string, uid: string, username: string, highlighterSelector: string) => void
    ): this
}

/* ====================
 * jQuery.cachedScript
 * ==================== */

interface JQueryStatic {
    /**
     * 以可缓存方式加载脚本（内部使用 $.ajax）
     */
    cachedScript(url: string, options?: JQueryAjaxSettings): JQueryXHR
}

/* ======================
 * String.prototype 扩展
 * ====================== */

/**
 * 简易模板：
 *  "Hello {name}".formatUnicorn({ name: "World" })
 *  "A {0} B {1}".formatUnicorn("x", "y")
 */
interface String {
    formatUnicorn(
        args: Record<string, string | number> | string | number,
        ...rest: Array<string | number>
    ): string
}

/* ==================
 * 其他零散导出常量
 * ================== */

/** 设计色值字段列表（脚本最后的 designDefault） */
declare var designDefault: ReadonlyArray<
    | 'background_color'
    | 'header_background_color'
    | 'text_color'
    | 'link_color'
    | 'header_text_color'
    | 'nav_color'
    | 'nav_link_color'
>

/** 常用的字符串集合：数组或对象映射 */
type StringCollection = ArrayLike<string> | string[] | Record<string, string>

/** Userscript 元数据（@include/@exclude/@match 等） */
interface UserscriptMeta {
    content?: string
    include?: string[]
    exclude?: string[]
    match?: string[]
    [key: string]: string[] | string | undefined
}

/** ukagaka 个性化面板配置 */
interface UkagakaCustomizeOption {
    value: string
    label: string
}

interface UkagakaCustomizeSection {
    title: string
    name: string
    type: 'radio' | 'checkbox' | 'text' | string
    displayType?: 'color-grid' | string
    defaultValue: string
    getCurrentValue: () => string
    onChange: (value: string) => void
    options: UkagakaCustomizeOption[]
}

/** Likes/Reaction 结构 */
interface LikeUser {
    username: string
    nickname: string
}
interface LikeItem {
    type: number
    main_id: number
    value: number
    emoji: string
    total: number
    selected?: boolean
    users: LikeUser[]
}
type LikesGridData = Record<string | number, LikeItem>

/** 时间线 Ajax 回复结构 */
interface AjaxReplyMainPost {
    pst_id: number
    dateline: string
    username: string
    nickname: string
    avatar: string
    sign: string
    pst_content: string
}
type AjaxReplySubPosts = Record<
    number,
    {
        pst_id: number
        dateline: string
        username: string
        nickname: string
        avatar: string
        pst_content: string
    }[]
>

interface AjaxReplyPayload {
    posts: {
        main?: Record<number, AjaxReplyMainPost>
        sub?: AjaxReplySubPosts
    }
    timestamp?: number
}

/** 公开的全局变量（尽量给出具体类型） */
declare var SHOW_ROBOT: string
declare var CHOBITS_UID: number
declare var CHOBITS_USERNAME: string
declare var SITE_URL: string
declare var CHOBITS_VER: string

/** 进度、按钮等辅助全局 */
declare var OtherEps: Record<string | number, string> | undefined
declare var EpBtn: string | undefined

/** 推送控制 */
declare var ENABLE_PUSH_NOTIFY: boolean | undefined
declare var PUSH_NOTIFY_TIMER: number | undefined

/** jQuery 插件与扩展（最小化且避免 any） */
interface JQuery<TElement = HTMLElement> {
    cluetip(options?: Record<string, unknown>): this
    validate(options?: {
        rules?: Record<string, unknown>
        messages?: Record<string, string>
        submitHandler?: (form: HTMLFormElement) => void
    }): this
    suggestBox(options: { dataUrl: string }): this
    slider(options?: Record<string, unknown>): this
}

/** 站内日志提示文案 */
declare const AJAXtip: Readonly<{
    wait: string
    saving: string
    eraseReplyConfirm: string
    eraseingReply: string
    eraseReply: string
    addingFrd: string
    addingDoujinCollect: string
    rmDoujinCollect: string
    addFrd: string
    addSay: string
    error: string
    no_subject: string
}>

/** 简单日志器 */
// declare const log: { debug: (msg: string) => void };

declare namespace ChiiLib {
    /* ---------- 工具类型 ---------- */

    /** Userscript 元数据（@name、@include、@match 等），值可能为多行 */
    interface UserscriptMeta {
        /** 脚本名 */
        name?: string[]
        /** URL 白名单（正则/通配） */
        include?: string[]
        /** URL 黑名单（正则/通配） */
        exclude?: string[]
        /** URL 匹配规则（@match） */
        match?: string[]
        /** 剩余源码内容（元数据块之后） */
        content?: string
        /** 其他自定义键 */
        [k: string]: string[] | string | undefined
    }

    /** 已加载/可加载的组件项 */
    interface WidgetItem {
        /** 应用 ID（开发平台 App ID） */
        app_id: string
        /** 资源 ID（资源版本或映射） */
        res_id: string
        /** 当前页面是否满足执行条件 */
        canExcute: boolean
        /** userscript 元信息 */
        meta: UserscriptMeta
    }

    /** 选项面板中的单项配置（radio 组） */
    interface OptionConfig {
        value: string
        label: string
    }

    /** 通用设置项（目前源码均为 radio，但保留可扩展性） */
    interface OptionSection {
        /** 分组标题 */
        title: string
        /** 字段名（cookie/attr 映射） */
        name: string
        /** 控件类型 */
        type: 'radio'
        /** 展示样式 */
        displayType?: 'color-grid'
        /** 默认值 */
        defaultValue: string
        /** 候选项 */
        options: OptionConfig[]
        /** 读取当前值（通常从 cookie） */
        getCurrentValue(): string
        /** 变更回调（写 cookie / 改 DOM 属性） */
        onChange(value: string): void
    }

    /** 个性化面板 Tab */
    interface PanelTabConfig {
        /** Tab 键（DOM id 前缀） */
        tab: string
        /** 标签文案 */
        label: string
        /** Tab 类型：选项面板或自定义内容 */
        type: 'options' | 'custom'
        /** 仅当 type 为 options 使用 */
        config?: OptionSection[] | null
        /** 仅当 type 为 custom 使用：静态 HTML 或生成函数 */
        customContent?: string | (() => string)
        onInit?: (tabSelector: string, $tabSelector: JQuery) => void
    }

    /* ---------- 模块声明 ---------- */

    /** konami 彩蛋 */
    interface Konami {
        /** 绑定 konami 指令后跳转到彩蛋页 */
        init(): void
    }

    /** 小组件加载与 userscript 支持 */
    interface Widget {
        /** 已解析的组件项 */
        items: WidgetItem[]
        /**
         * 加载 userscript 与样式
         * @param plugins 脚本 URL 列表
         * @param styles  样式 URL 列表
         */
        loader(
            plugins: Array<string> | Record<string, string>,
            styles: Array<string> | Record<string, string>
        ): void

        /**
         * 解析 userscript 源码中的 ==UserScript== 元数据块
         * @returns 元数据对象，失败时返回 {}
         */
        userscriptParser(userscriptText: string): UserscriptMeta

        /**
         * 调用萌否电台接口，为条目插入收听按钮（JSONP）
         * @param bgm_id 条目 ID
         * @param title  标题
         */
        moefm(bgm_id: number | string, title: string): void

        /** 获取被暂停的组件列表（localStorage） */
        getPausedApps(): string[]

        /** 覆盖保存被暂停的组件列表 */
        setPausedApps(pausedApps: string[]): void

        /** 指定 App 是否被暂停 */
        isAppPaused(app_id?: string | number | null): boolean

        /** 暂停指定 App */
        pauseApp(app_id?: string | number | null): boolean

        /** 恢复指定 App */
        resumeApp(app_id?: string | number | null): boolean

        /** 切换暂停/恢复 */
        toggleAppPause(app_id?: string | number | null): boolean
    }

    /** 列表项“启用/停用”按钮（fetch GET + 按钮状态切换） */
    interface Gadget {
        /** 绑定页面上的启用/停用按钮 */
        initToggleButtons(): void
        /** 立即对某个 a 元素执行启用/停用请求并更新文案 */
        _toggleRequest(a: HTMLAnchorElement): void
    }

    /** 站内小助手（春菜 / 主题 / 个性化面板 / Live2D） */
    interface Ukagaka {
        /** 初始化春菜（主题、菜单、按钮、Live2D 等） */
        init(): void
        /** 显示/隐藏春菜（可动画/延时） */
        isDisplay(isDisplay: boolean, animated?: boolean, timeout?: number): void
        /** 从 cookie 读取显示状态 */
        isCookieDisplay(): void
        /** 切换显示状态并更新 cookie */
        toggleDisplay(): void

        /** 根据 cookie/系统偏好初始化主题与尺寸、导航模式等 */
        currentTheme(): void
        /** 跟随系统自动主题并监听变更 */
        autoTheme(): void
        /** 切换“开灯/关灯”按钮文案 */
        isDark(isDark: boolean): void
        /** 为目标元素设置 data-theme 并触发过渡动画 */
        setTheme(element: JQuery, style: 'light' | 'dark'): void
        /** 应用主题并可记住选择（写 cookie） */
        updateTheme(style: 'light' | 'dark', remember: boolean): void
        /** 明/暗模式切换（记忆选择） */
        toggleTheme(): void

        /** 个性化面板：动态 Tab 与选项项 */
        panelTabs: PanelTabConfig[]
        /** 通用设置扩展（供第三方注入） */
        extensionConfigs: OptionSection[]
        /** 新增/替换一个通用设置项（同名合并） @link https://bgm.tv/group/topic/435098 */
        addGeneralConfig(configItem: OptionSection): void
        /** 移除某个通用设置项 @link https://bgm.tv/group/topic/435098 */
        removeGeneralConfig(configName: string): void
        /** 刷新“通用”Tab 内容 @link */
        refreshGeneralTab(): void
        /** 读取默认通用设置清单（主题色/封面尺寸等） */
        getDefaultGeneralConfig(): OptionSection[]
        /** 新增/替换一个面板 Tab（同名覆盖） @link https://bgm.tv/group/topic/435098 */
        addPanelTab(tabConfig: PanelTabConfig): void
        /** 删除指定 Tab 并刷新面板 @link https://bgm.tv/group/topic/435098 */
        removePanelTab(tabName: string): void
        /** 重新渲染整个面板（保留当前 Tab） */
        refreshPanel(): void
        /** 若未创建则创建面板，并绑定事件 */
        initCustomizePanel(): void

        /** 以下为面板内部渲染/事件工具（返回 HTML 字符串/绑定事件） */
        generatePanelHTML(): string
        generatePanelTabs(): string
        generateOptionsTabContent(config: OptionSection[]): string
        generateColorGridOptions(section: OptionSection): string
        generateRadioOptions(section: OptionSection): string
        generateWidgetsTabContent(): string
        generateWidgetItem(item: WidgetItem): string

        initializePanelSettings(): void
        bindPanelEvents(): void
        bindCloseButtonEvent(): void
        bindTabSwitchEvents(): void
        bindWidgetPauseEvents(): void
        updateWidgetButtonState($btn: JQuery<HTMLElement>, app_id: string | number): void
        showRefreshNotice(): void
        bindConfigChangeEvents(config: OptionSection[]): void
        bindAllConfigChangeEvents(): void

        /** 应用主题模式：auto | light | dark */
        applyThemeMode(themeMode: 'auto' | 'light' | 'dark'): void
        /** 批量应用个性化设置（主题模式与主题色） */
        applyCustomizeSettings(): void
        /** 设置 html 的 data-* 属性并记录 cookie，带过渡动画 */
        applyAttributeSetting(attribute: string, cookieName: string, value: string): void
        /** 设置主题色（data-theme-color + cookie） */
        setThemeColor(color: string): void
        /** 打开个性化面板 */
        showCustomizePanel(): void

        /** 在春菜气泡中展示 HTML，可自动消失或下滑出现 */
        presentSpeech(html: string, auto_dismiss?: boolean, slide_down?: boolean): void
        /** 关闭可编辑气泡，显示默认静态气泡 */
        dismissSpeech(): void

        /** 语音按钮：随机播放内置声音 */
        initVoice(): void
        /** 播放给定 voice 列表中的随机项 */
        playVoice(voice_list: number[]): void

        /** 更新单话观看状态后引导用户吐槽 */
        presentEpComment(ep_id: number | string, status_name: string, formhash: string): void
        /** 发表“吐槽”状态的简单入口 */
        presentTsukkomi(): void
        /** 春菜单：服务菜单/调教入口等 */
        initMenu(): void

        /** Live2D 模型加载/重载/销毁 */
        initLive2D(): void
        reloadLive2D(): void
        disposeLive2D(): void

        /** 角色列表视图切换（grid/list） */
        toggleCrtList(): void
        /** 角色职能/出演类型筛选菜单 */
        crtCastTypeFilter(): void

        /** 图表封装（amCharts5） */
        init_chart(
            /** 容器根节点 ID（amCharts Root） */
            root_element: string,
            /** 数据集（每项应包含各 series 的数值及 title） */
            data: Array<Record<string, string | number>>,
            /** series 名称 -> 字段名 映射 */
            series_sets: Record<string, string>,
            /** 是否启用评分模式（显示平均分/票数） */
            enable_score: boolean
        ): void

        /** 初始化多个图表（根据全局 CHART_SETS） */
        charts(): void

        /** 其他：浏览/条目页交互等（保留占位以避免 any） */
        browser(): void
        subject: unknown // 细分功能已由上面方法覆盖要点
    }

    /** 登录/验证码相关 */
    interface Login {
        /** 登录表单初始化：输入即展示验证码 */
        init(): void
        /** 生成图片验证码（点击刷新） */
        genCaptcha(refresh: boolean): void
        /** reCAPTCHA 校验（v3） */
        verifyRecaptcha(): void
    }

    /** 首页（未登录） */
    interface HomeGuest {
        /** 初始化首页轮播与登录框 */
        init(): void
    }

    /** 赞/表情 组件 */
    namespace Likes {
        interface LikeUser {
            username: string
            nickname: string
        }
        interface LikeReaction {
            type: number
            main_id: number
            value: number
            emoji: string
            total: number
            selected?: boolean
            users: LikeUser[]
        }
        /** related_id -> (reactionKey -> reaction) */
        type LikesMap = Record<string | number, Record<string, LikeReaction>>

        interface API {
            /** 发送点赞/取消请求 */
            req(ele: Element): void
            /** 根据元素 data-like-related-id 刷新对应网格 */
            updateGrid(ele: Element, data: LikesMap | null): void
            /** HTML 转义 */
            escapeHtml(unsafe: string): string
            /** 直接使用 related_id + 数据 刷新网格 */
            updateGridWithRelatedID(
                related_id: string | number,
                data: Record<string, LikeReaction> | null,
                is_live?: boolean
            ): void
            /** 批量刷新所有网格 */
            updateAllGrids(likes_list: LikesMap): void
            /** 初始化 Tooltip、下拉面板与首屏数据 */
            init(): void
        }
    }

    /** 年度评选/提名交互 */
    namespace SubjectSelection {
        interface SubjectBrief {
            subject_id: string | number
            subject_name: string
            subject_image: string
        }
        interface SelectionItem {
            /** 评选项 ID */
            id: string | number
            /** 文案 */
            name: string
            /** 是否基础模式可见 */
            basic?: boolean
        }
        interface PickedItem {
            subject_type: string
            selection_id: string | number
            selection_name: string
            subject_id: string | number
            subject_name: string
            subject_image: string
        }
        /** 用户选择集合：按 subject_type 再按 selection_id 索引 */
        type UserSelectionSets = Record<string, Record<string | number, PickedItem>>

        interface API {
            /** localStorage key */
            localStorageKey(): string

            /** 删除某个选择（若存在），返回是否删除 */
            removeSelectionData(ele: JQuery<HTMLElement>): boolean

            /** 单条目是否已达最多两次提名限制 */
            maxSelected(ele: JQuery<HTMLElement>): boolean

            /** 统计总提名数 */
            selectionCount(): number

            /** 写入/覆盖某个选择 */
            updateSelectionData(ele: JQuery<HTMLElement>): void

            /** 持久化 data_user_selelction_sets */
            save(): void

            /** 绑定提交事件（校验/禁用按钮/异步提交） */
            bindSubmit(): void

            /** 为弹窗容器追加用户收藏条目清单 */
            appendSubjectCollections(
                container: JQuery<HTMLElement>,
                subject_type: string,
                selection_id: string | number,
                selection_name: string,
                data: SubjectBrief[] | null
            ): void

            /** 切换 basic/advanced 模式并重绘占位 */
            switchMode(mode: 'basic' | 'advanced'): void

            /** 初始化评选交互与持久化 */
            init(): void
        }
    }

    /** 忽略用户（过滤其动态/评论） */
    interface Ignore {
        /** 初始化：按 data_ignore_users 移除 DOM 项 */
        init(): void
        /** 立即隐藏页面上该用户的元素 */
        ignoreItem(user: string): void
        /** 提交“绝交”：后台保存后调用 ignoreItem */
        ignoreUser(user: string, formhash: string): void
    }

    /** 楼层回复/子回复 Ajax 相关 */
    interface AjaxReply {
        /** 折叠包含 +数字 的子回复，点击展开 */
        collapseReplies(): void
        /** 主楼回复表单提交、删除等 */
        mainReply(): void

        /** 加载并插入楼中楼（子回复） */
        loadComments(id: number | string, url: string, callback?: () => void): void

        /** 子回复入口（在目标楼层下生成回复框并提交） */
        subReply(
            type: string,
            topic_id: number | string,
            post_id: number | string,
            sub_reply_id: number | string,
            sub_reply_uid: number | string,
            post_uid: number | string,
            sub_post_type: 0 | 1
        ): void

        /** 其他插入/更新工具（列表增量渲染） */
        insertMainComments(list_id: string, json: unknown): void
        insertSubComments(list_id: string, json: unknown): void
        insertJsonComments(list_id: string, json: unknown): void
        updateLastView(element: JQuery<HTMLInputElement>): void
    }

    /** 关系编辑页工具（条目/角色/人物关系录入） */
    interface Relations {
        /** Tab 切换与搜索模式 */
        searchTabs(): void
        /** 初始化“按关系/条目/人物”分组与筛选 */
        initGroupByFilters(): void
        /** 生成关系类型下拉（支持禁用） */
        genCrtRelationList(
            arrIndex: number,
            key_prefix?: string,
            selectedValue?: string | number,
            disabled?: boolean
        ): string
        /** 初始化 */
        init(): void
        /** 其余生成/删除 DOM 的方法保留为 unknown（不影响调用方） */

        prepareRelationList(
            search_mod: string,
            info: Record<string, unknown>,
            addedSubjects: Array<number | string>,
            main_name: string,
            options?: { prepend_to?: string; reverse?: boolean; readonly?: boolean }
        ): void
        prepareSearchList(info: Record<string, unknown>, target: string): void
        genSubjectList(
            subject: {
                id: number | string
                url_mod: string
                name: string
                name_cn?: string
                img: string
                extra?: string[]
            },
            key: string,
            target: string
        ): string
        genRelatedItem(
            search_mod:
                | 'person'
                | 'character'
                | 'cv_person'
                | 'person-character-cv'
                | 'character-character'
                | 'person-person'
                | string,
            item: Record<string, unknown>,
            addedSubjects: Array<number | string>,
            subjectCount: number,
            key_prefix?: string,
            item_class?: string,
            main_name?: string,
            options?: { prepend_to?: string; reverse?: boolean; readonly?: boolean }
        ): void
        rmParent(this: JQuery<HTMLElement>): void
    }

    /** 首页/时间线/提醒等（仅暴露入口，内部细节多为 DOM 操作） */
    interface Home {
        init(): void
        /** 收视进度批量提交（弹春菜提示） */
        prgBatchManager(form: JQuery<HTMLFormElement>): void
        /** 工具提示/视图切换/提醒拉取等内部入口 */
        prgToolTip(target: string, topOffset: number, leftOffset?: number): void
        togglePushNotify(enable: boolean): void
        pushNotify(): void
        ignoreAllNotify(): void
        prgInitPanel(): void
        epStatusClick(target: Element | HTMLAnchorElement): void
        prg(): void
        filterInfoPanel($list: JQuery, $infoPanel: JQuery, type_id: number | string): void
        setPushNotifyEvents(): void
        simplePushNotify(): void
        setupPrgToolTip(target: string, topOffset: number, leftOffset?: number): void
    }

    /* ---------- 聚合导出 ---------- */

    interface API {
        konami: Konami
        widget: Widget
        gadget: Gadget
        ukagaka: Ukagaka

        login: Login
        home_guest: HomeGuest

        likes: Likes.API
        subject_selection: SubjectSelection.API
        ignore: Ignore
        ajax_reply: AjaxReply
        relations: Relations

        /** 其他模块（体量较大，按需扩展，无 any） */
        home: Home
        prg_mobile: {
            init(): void
            epStatusClick(target: Element | HTMLAnchorElement): void
            epCheckIn(target: Element | HTMLAnchorElement): void
            batchManager(form: JQuery<HTMLFormElement>): void
        }
        user: unknown
        blog: unknown
        tml_status: {
            init(): void
        }
        tml: {
            rm(): void
            load(url?: string, type?: string, is_mobile?: boolean): void
            tab_highlight(type: string): void
            filter(): void
            pager(): void
            updateStatus(): void
            postComments(id: number | string, url: string): void
            commentsSubReply(id: number | string): void
            loadComments(id: number | string, url: string, callback?: () => void): void
            replyStatus(): void
            prepareAjax(): void
            init(): void
        }
        subject: {
            init(): void
            toggleCrtList(): void
            crtCastTypeFilter(): void
            updateCollectBlock(subject_id: number | string, hash: string): void
            browser(): void
            addTag(tag: string): void
            mergeTag(): void
            mergeInputTag(): void

            init_chart(
                root_element: string | HTMLElement,
                data: Array<Record<string, unknown>>,
                series_sets: Record<string, string>,
                enable_score?: boolean
            ): void

            charts(): void
        }
        subject_edit: {
            init(): void
        }
        airTimeMenu: {
            settings: {
                target: JQuery
                yearTestRegex: RegExp
            }
            init(): void
            tmoutEventMove(target: Element): number
            tmoutEventOut(): number
            closeFuture(anchors: JQuery<HTMLAnchorElement>): void
            updateYearAnchors(
                sign: '+' | '-',
                increased: number,
                ul: JQuery,
                anchors: JQuery<HTMLAnchorElement>
            ): void
        }
        wiki: {
            init(): void
        }
        user_index: {
            init(): void
            manage(): void
        }

        club: {
            init(): void
        }

        search: {
            initSearchText(selector: string | Element): void
        }

        doujinHome: {
            setTab(list_id: string, wrapper_id: string, wrapper_find: string): void
            init(): void
        }

        doujinCreate: {
            init(): void
        }

        doujinRelated: {
            init(): void
        }

        doujinCollect: {
            init(): void
            manage(target: Element | HTMLAnchorElement): void
        }

        style_design: {
            setTheme(themeID: string | number): void
            isDefaultDesign(): boolean
            validateDefaultDesign(): void
            updateColors(): void
            setBackgroundImage(url: string, tiled?: boolean): void
            switchDesignTab(id: 'modifyBG' | 'modifyHeader' | string): void
            init(): void
        }

        notify: {
            init(): void
        }

        rakuen_frame: {
            init(): void
        }

        rakuen_new_topic: {
            init(): void
        }

        rakuen_topic_list: {
            init(): void
        }
        topic_history: {
            init(): void
            buildSortByMenu(
                $container: JQuery,
                groups: Record<string, Record<string, string>>
            ): void
            updateSortCurrent(
                $container: JQuery,
                groups: Record<string, Record<string, string>>,
                current_sort_by: string,
                current_filter_by: string
            ): void
            getFriendsList(
                suggestList: Record<string, { username: string; nickname: string }> | undefined,
                callback: (list: Record<string, { username: string; nickname: string }>) => void
            ): void
            updateSortBy(sortBy: 'asc' | 'desc'): void
            updateFilterBy(filterBy: 'all' | 'likes' | 'self' | 'author' | 'friends'): void
            initSortBy(): void
            slider(): void
        }

        event_location_choose: {
            init(): void
        }

        event_view: {
            init(): void
        }
    }
}

/** chiiLib 全局对象 */
declare var chiiLib: ChiiLib.API

/** 其他全局函数（页面中直接使用） */
declare function submitTip(mainSelectorOrElement?: string | Element | JQuery): void
declare function submitError(): void
declare function removeListItem(
    btn_dom: string,
    item_prefix: string,
    tip_confirm: string,
    tip_ing: string,
    tip_done: string
): void
declare function submitPost(action: string, key: string, val: string): false

/** 常用小工具 */
declare function getObj<T extends HTMLElement = HTMLElement>(id: string): T | null
declare function switchDisplay(id: string): void
declare function PostTo(
    subject_id: number | string,
    subject_name: string,
    type: 'subject' | 'group'
): void
declare function checkall(
    form: HTMLFormElement,
    prefix?: string,
    checkall?: string,
    limit?: number
): void
declare function seditor_ctlent(event: KeyboardEvent, form_id: string): void
declare function SetTips(value: string): void
declare function regSetNickName(): void
declare function sizeContent(delta: number, textareaId: string): void
declare function AddMSGreceiver(nickname: string): void
declare function GenInterestBox(id: string): void
declare function MoreElement(
    type: 'text' | 'checkbox' | 'radio' | string,
    name: string,
    containerId: string,
    classname: string
): void
declare function eraseSubjectCollect(subjectID: number | string, hash: string): void
declare function eraseGrpTopic(topicID: number | string, hash: string): void
declare function eraseSubjectTopic(topicID: number | string, hash: string): void
declare function eraseClubTopic(topicID: number | string, hash: string): void
declare function eraseEntry(ID: number | string, hash: string): void
declare function erasePM(pmID: number | string, hash: string): void
declare function ignoreUser(user: string, hash: string): void
declare function disconnectFriend(frdId: number | string, frdNick: string, hash: string): void
declare function checkTsukkomiInput(
    doingId: string,
    statusId: string,
    max_length?: number,
    desc?: boolean,
    substring?: boolean
): void
declare function switchRobotSpeech(): void

/** Wiki/Infobox 编辑工具 */
declare var nowmode: 'wcode' | 'normal'
declare var infoboxVal: Record<string, unknown>
declare function WikiTpl(value: string, infoboxId?: string): void
declare function WCODEParse(input: string): Record<string, unknown>
declare function WCODEDump(array: Record<string, unknown>): string
declare function WCODEtoNormal(): void
declare function NormaltoWCODE(): void
declare function addSubProp(obj: HTMLElement): void
declare function stopEnterSubmit(): void
declare function multiKeyRegDel(): void
declare function addoneprop(): void

// editor

/** 脚本里作为下拉表情菜单使用的条目结构 */
interface SmileItem {
    name: string
    replaceWith: string
    className: string
}

/** 你的脚本文件中导出的全局表情集合与预置配置对象 */
declare var bgm_tv_smiles_sets: ReadonlyArray<SmileItem>
declare var bgm_vs_smiles_sets: ReadonlyArray<SmileItem>
declare var bgm_tv_500_smiles_sets: ReadonlyArray<SmileItem>
declare var bgm_smiles_sets: ReadonlyArray<SmileItem>

/** 预置的 markItUp 配置（完整编辑器 / 简易编辑器 / 表情选择器） */
declare var mySettings: MarkItUp.Options
declare var simpleSettings: MarkItUp.Options
declare var emojiEditorSettings: MarkItUp.Options

/**
 * 插入图片占位的全局函数
 * @param id 照片 id
 * @param path 照片路径
 */
declare function insertPhoto(id: string | number, path: string): void
