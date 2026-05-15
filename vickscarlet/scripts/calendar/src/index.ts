// import { addStyle, observeChildren } from '@common/dom'
import { create } from '@b38dev/dom/js'
// import css from './index.css?inline'
;(() => {
    console.debug('bangumi calendar')
    // addStyle(css)

    const btn = create('a', { title: '时间表模式', href: 'javascript:void(0)' }, [
        'span',
        '平铺',
    ]) as HTMLAnchorElement
    document.querySelector('#prgManagerMode')?.append(create('li', btn))
    const panel = create('div') as HTMLDivElement
    document.querySelector('#prgManagerMain')?.append(panel)
    btn.addEventListener('click', () => {
        panel.style
    })
})()
