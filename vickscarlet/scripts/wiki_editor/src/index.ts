import { load, create, config } from './editor'
import { addStyle } from '@b38dev/dom'
import { dom } from '@b38dev/dom'
import css from './index.css?inline'

async function main() {
    const element: HTMLTextAreaElement | null =
        document.querySelector('#subject_infobox') ?? document.querySelector('#subject_summary')
    if (!element) return

    const options = [
        {
            label: '显示行号',
            key: 'showLineNumber',
            get: () => config.showLineNumber,
            set: (v: boolean) => (config.showLineNumber = v),
        },
        {
            label: '显示MiniMap',
            key: 'showMiniMap',
            get: () => config.showMiniMap,
            set: (v: boolean) => (config.showMiniMap = v),
        },
        {
            label: '自动折行',
            key: 'wordWrap',
            get: () => config.wordWrap,
            set: (v: boolean) => (config.wordWrap = v),
        },
    ]
    chiiLib.ukagaka.addPanelTab({
        tab: 'wiki-enhance-editor',
        label: '维基编辑器',
        type: 'custom',
        customContent: () =>
            `<div class="wiki-enhance-editor-settings">
                <ul>${options
                    .map(
                        (option) => `
                        <li class="widget-item">
                            <div>${option.label}</div>
                            <div class="v-custom-switch">
                                <input
                                    id="wiki-enhance-editor-${option.key}"
                                    type="checkbox"
                                    name="${option.key}"
                                    ${option.get() ? 'checked' : ''}
                                >
                                <label for="wiki-enhance-editor-${option.key}"></label>
                            </div>
                        </li>`
                    )
                    .join('')}
                </ul>
            </div>`,
        onInit: (_, $el) => {
            for (const option of options) {
                const input = $el.find<HTMLInputElement>(`#wiki-enhance-editor-${option.key}`)
                input.on('change', (e) => option.set(e.target.checked))
            }
        },
    })

    await load('https://cdn.jsdelivr.net/npm/monaco-editor/min/')
    addStyle(css)
    const container = dom.create('div', { class: 'wiki-enhance-editor-container' })
    const resize = dom.create('div', { class: 'wiki-enhance-editor-resize' })
    const editor = dom.create('div', { class: 'wiki-enhance-editor' }, container, resize)
    const obStyle = {
        attributes: true,
        attributeFilter: ['style'],
        attributeOldValue: true,
        childList: false,
        characterData: false,
        subtree: false,
        characterDataOldValue: false,
    }
    new MutationObserver(() => {
        container.style.height = resize.style.height
    }).observe(resize, obStyle)
    element.parentElement!.insertBefore(editor, element)
    editor.style.display = element.getAttribute('style')?.includes('display: none')
        ? 'none'
        : 'flex'
    let update = create(container, element.value, (value) => {
        if (element.value === value) return
        element.value = value
    })
    new MutationObserver((mutations) => {
        let oldValue = mutations[0].oldValue
        if (oldValue?.includes('display: none')) {
            editor.style.display = 'flex'
            update(element.value)
        } else {
            editor.style.display = 'none'
        }
    }).observe(element, obStyle)
}

main()
