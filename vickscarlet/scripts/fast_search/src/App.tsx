import React, { useEffect, useRef, useState } from 'react'
import { Command, type Notify, parseQuery, search, SearchQuery } from '@/api'
import { SearchItemList, type SearchItemListProps } from '@/components/SearchItemList'
import Tips from '@/components/CommandTips'
import Banner from '@/components/Banner'
import { timeout } from '@/util/timeout'
import './App.css'
import './SearchTool.css'

interface SearchToolProps {
    timeout?: number
}

interface MQ {
    key: string
    query: SearchQuery<Command>
    init: boolean
}

export const keyShortcut = [
    {
        shortcuts: [{ key: '/' }, { key: 'K', ctrl: true }],
        description: '打开搜索框',
    },
    {
        shortcuts: [{ key: 'Escape' }],
        description: '关闭搜索框',
    },
]

const filters = new Set(['INPUT', 'TEXTAREA'])
export function App(props: SearchToolProps) {
    const [showSearchTool, setShowSearchTool] = useState(false)
    const [pedding, setPadding] = useState(true)
    const [inComposition, setInComposition] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [banner, setBanner] = useState<React.ReactNode | null>(null)
    const [tips, setTips] = useState<React.ReactNode | null>(null)
    const [list, setList] = useState<SearchItemListProps | null>(null)
    const [input, setInput] = useState('/')
    const inputValue = useRef('/')
    const lastValue = useRef('')
    const totalPages = useRef(Infinity)
    const currentPage = useRef(0)
    const lastList = useRef<SearchItemListProps | null>(null)
    const fetching = useRef(false)
    const mq = useRef<MQ | null>(null)
    const ref = useRef<HTMLDivElement>(null)
    const cancelSearch = useRef(() => {})

    const close = () => {
        setShowSearchTool(false)
        cancelSearch.current()
    }

    const setCancelSearch = (rj: () => void) =>
        (cancelSearch.current = () => {
            rj()
            cancelSearch.current = () => {}
        })

    const handleNotify = (e: Notify) => {
        if (e.banner) setBanner(e.banner)
        if (e.tips) setTips(e.tips)
    }

    const checkScroll = () => {
        if (!ref.current) return false
        const el = ref.current
        return el.clientHeight + el.scrollTop + 30 >= el.scrollHeight
    }

    const next = async ({ key, query }: MQ) => {
        if (currentPage.current >= totalPages.current) return false
        const page = currentPage.current + 1
        if (fetching.current) return true
        fetching.current = true
        if (key !== mq.current?.key) return false
        const res = await search(query, page)
        if (key !== mq.current?.key) return false
        fetching.current = false
        console.debug('search result', res)
        handleNotify(res)
        if (!res.success) {
            totalPages.current = currentPage.current
            setHasMore(false)
            return false
        }
        currentPage.current = page
        setPadding(false)
        const { items, extra } = res.data
        totalPages.current = extra.page.total
        if (currentPage.current >= totalPages.current) {
            setHasMore(false)
        }
        if (lastList.current) {
            lastList.current = {
                command: query.command,
                items: [...lastList.current.items, ...items],
            }
        } else {
            lastList.current = { command: query.command, items: items }
        }
        setList(lastList.current)
        return currentPage.current < totalPages.current
    }

    const tryNext = async (query?: MQ | null, ms = 50, r = false) => {
        cancelSearch.current()
        if (!query) {
            if (!r && !checkScroll()) return
            return timeout(
                async () => {
                    if (!mq.current) return false
                    await next(mq.current)
                    await tryNext()
                },
                ms,
                setCancelSearch
            )
        }
        return timeout(
            async () => {
                console.debug('ready to search', query)
                fetching.current = false
                lastList.current = null
                mq.current = query
                totalPages.current = Infinity
                currentPage.current = 0
                setHasMore(true)
                setList(null)
                if (!mq.current) return false
                mq.current.init = true
                await next(mq.current)
                await tryNext(null, 50, true)
            },
            ms,
            setCancelSearch
        )
    }
    const handleChange = (value: string) => {
        setInput(value)
        cancelSearch.current()
        inputValue.current = value
        if (inComposition) return
        if (value === lastValue.current && !mq.current?.init) return
        lastValue.current = value
        setPadding(true)
        const parsed = parseQuery(value)
        handleNotify(parsed)
        if (!parsed.success) return
        tryNext({ key: value, query: parsed.data, init: false }, props.timeout ?? 300)
    }

    useEffect(() => {
        if (!showSearchTool) {
            document.body.classList.remove('v-fast-search-app-open')
        } else {
            document.body.classList.add('v-fast-search-app-open')
        }
    }, [showSearchTool])
    useEffect(() => {
        document.addEventListener('keydown', (e) => {
            if (showSearchTool && e.key === 'Escape') {
                e.preventDefault()
                close()
                return
            }

            if (filters.has((e.target as Element).tagName)) return
            switch (e.key) {
                case 'k':
                case 'K':
                    if (!e.ctrlKey) return
                    break
                case '/':
                    break
                default:
                    return
            }
            e.preventDefault()
            setShowSearchTool(true)
        })
    }, [])

    useEffect(() => handleNotify(parseQuery('')), [])
    useEffect(() => {
        console.debug('inComposition', inComposition)
        if (inComposition) return
        handleChange(inputValue.current)
    }, [inComposition])
    useEffect(() => {
        if (!ref.current) return
        const el = ref.current
        const onScroll = () => tryNext()
        el.addEventListener('scroll', onScroll)
        return () => el.removeEventListener('scroll', onScroll)
    }, [ref])
    if (!showSearchTool) return <></>

    return (
        <div className="v-fast-search-app" data-show={showSearchTool}>
            <button onClick={() => close()}></button>
            <div className="v-search-tool">
                <input
                    className="wide"
                    autoFocus
                    value={input}
                    name="fase-search"
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            e.preventDefault()
                            close()
                        }
                    }}
                    onChange={(e) => handleChange(e.target.value)}
                    onCompositionStart={() => setInComposition(true)}
                    onCompositionEnd={() => setInComposition(false)}
                ></input>
                {pedding && banner && (
                    <div className="v-search-tool-banner">
                        <Banner banner={banner} />
                    </div>
                )}
                {pedding && tips && (
                    <div className="v-search-tool-tips">
                        <Tips tips={tips} />
                    </div>
                )}
                <div className="v-search-tool-container" ref={ref}>
                    {list && <SearchItemList command={list.command} items={list.items} />}
                    <div className="v-search-tool-loading">
                        <h3>{!pedding && (hasMore ? '✨加载中 ...' : '😊没有更多了')}</h3>
                    </div>
                </div>
            </div>
        </div>
    )
}
