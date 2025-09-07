import { isMe } from '@b38dev/bangumi'
import { addStyle, observeChildren } from '@b38dev/dom'
import { create } from '@b38dev/dom/js'
import css from './index.css?inline'
;(() => {
    addStyle(css)

    function createBar() {
        const input = create('input')!
        const button = create('button')!
        return create('div', input, button)
    }
    function createPanel() {
        const bar = createBar()
        const panel = create('div', {
            events: [
                [
                    'keydown',
                    (e) => {
                        if (!e.ctrlKey) return
                    },
                ],
            ],
        })!
    }

    document.addEventListener('keydown', (e) => {
        if (!e.ctrlKey) return
        switch (e.key) {
            case 'k':
            case 'K':
                break
            default:
                return
        }
        createPanel()
    })
})()
