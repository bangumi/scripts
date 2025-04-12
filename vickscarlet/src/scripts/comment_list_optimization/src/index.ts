import {
    addStyle,
    waitElement,
    observeChildren,
    resizeObserver,
    intersectionObserver,
} from '@common/dom'
import css from './vhd.css?inline'
import initCss from './init.css?inline'
addStyle(css)
const style = addStyle(initCss)
waitElement(document, '#comment_list').then(async (container) => {
    if (!container) return
    // 监听高度变化
    const ro = resizeObserver((entrie) => {
        const placeholder = entrie.target.querySelector(':scope>.v-ph') as HTMLBaseElement
        if (!placeholder) return
        placeholder.style.height = entrie.contentRect.height + 'px'
    })

    // 监听可见性变化
    const io = intersectionObserver((entry) => {
        const item = entry.target
        if (entry.isIntersecting) item.classList.remove('v-hd')
        else item.classList.add('v-hd')
    })

    interface ExtendElement extends Element {
        _listOptimization?: boolean
    }
    // 监听评论列表变化
    observeChildren(container, (item: ExtendElement) => {
        if (item._listOptimization) return
        item._listOptimization = true
        item.classList.add('v-hd')
        const placeholder = document.createElement('div')
        placeholder.classList.add('v-ph')
        item.append(placeholder)
        ro.observe(item)
        io.observe(item)
    })
    style.remove()

    const onHashChange = () => {
        const hash = window.location.hash
        if (!hash) return
        const item = document.querySelector(hash)
        if (!item) return
        item.scrollTo()
    }
    window.addEventListener('hashchange', onHashChange)
    document.addEventListener('load', onHashChange)
    onHashChange()
})
