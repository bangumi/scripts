import content from './config.html?raw'
import style from './config.css?raw'

export interface Config {
    total: number
    ratio: number
    speed: number
    rot: number
    snowSize: RangeValue
    emojiSize: RangeValue
}
export type Zone = {
    [K in keyof Config]: RangeValue
}

export interface RangeValue {
    min: number
    max: number
}

function bindThumb(
    slider: HTMLElement,
    thumbs: HTMLElement[],
    onChange: (value: number, pos: number) => void
) {
    const rect = () => slider.getBoundingClientRect()
    const isDouble = !!thumbs[1]
    let current = 0

    const onMove = (e: PointerEvent) => {
        const r = rect()
        const x = e.clientX - r.left
        onChange(x / r.width, current)
    }

    const stop = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', stop)
        document.removeEventListener('pointercancel', stop)
    }

    slider.addEventListener('pointerdown', (e: PointerEvent) => {
        e.preventDefault()
        if (isDouble) {
            const p0 = thumbs[0].getBoundingClientRect().left + thumbs[0].offsetWidth / 2
            const p1 = thumbs[1].getBoundingClientRect().left + thumbs[1].offsetWidth / 2
            current = Math.abs(e.clientX - p0) < Math.abs(e.clientX - p1) ? 0 : 1
        }
        thumbs[current].setPointerCapture(e.pointerId)
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', stop)
        document.addEventListener('pointercancel', stop)
        onMove(e)
    })
}

interface RangeProps {
    item: HTMLElement
    init: number
    zone: RangeValue
    onChange: (value: number) => void
}

function setupRange({ item, init, zone, onChange }: RangeProps) {
    let state = init
    const number = item.querySelector<HTMLInputElement>('input')!
    const slider = item.querySelector<HTMLDivElement>('.slider')!
    const range = item.querySelector<HTMLDivElement>('.range')!
    const thumb = item.querySelector<HTMLDivElement>('.thumb')!

    const percent = (v: number) => ((v - zone.min) / (zone.max - zone.min)) * 100
    const clamp = (v: number) => Math.min(zone.max, Math.max(zone.min, v))

    number.min = String(zone.min)
    number.max = String(zone.max)
    range.style.left = '0'

    const sync = (value: number) => {
        state = clamp(Math.round(value))
        number.value = String(state)
        range.style.width = thumb.style.left = `${percent(state)}%`
        onChange(state)
    }

    bindThumb(slider, [thumb], (v) => sync(v * (zone.max - zone.min) + zone.min))
    number.addEventListener('input', () => sync(Number(number.value)))
    sync(state)
}

interface DoubleRangeProps {
    item: HTMLElement
    init: RangeValue
    zone: RangeValue
    onChange: (value: RangeValue) => void
}

function setupDoubleRange({ item, init, zone, onChange }: DoubleRangeProps) {
    const state = { ...init }
    const values = [state.min, state.max]
    const j = () => values[0] > values[1]
    const [minNum, maxNum] = item.querySelectorAll<HTMLInputElement>('input')
    const slider = item.querySelector<HTMLDivElement>('.slider')!
    const rangeEl = item.querySelector<HTMLDivElement>('.range')!
    const [thumb0, thumb1] = item.querySelectorAll<HTMLDivElement>('.thumb')

    const percent = (v: number) => ((v - zone.min) / (zone.max - zone.min)) * 100
    const clamp = (v: number) => Math.min(zone.max, Math.max(zone.min, v))

    const updateUI = () => {
        const p0 = percent(values[0])
        const p1 = percent(values[1])

        thumb0.style.left = `${p0}%`
        thumb1.style.left = `${p1}%`

        rangeEl.style.left = `${Math.min(p0, p1)}%`
        rangeEl.style.width = `${Math.abs(p1 - p0)}%`

        onChange(state)
    }

    minNum.min = String(zone.min)
    minNum.max = String(zone.max)
    maxNum.min = String(zone.min)
    maxNum.max = String(zone.max)

    const syncMin = (value: number) => {
        value = clamp(Math.round(value))
        minNum.value = String(value)
        state.min = value
        if (j()) {
            values[1] = value
            values[0] = state.max
        } else {
            values[0] = value
            values[1] = state.max
        }
        updateUI()
    }

    const syncMax = (value: number) => {
        value = clamp(Math.round(value))
        maxNum.value = String(value)
        state.max = value
        if (j()) {
            values[0] = value
            values[1] = state.min
        } else {
            values[1] = value
            values[0] = state.min
        }
        updateUI()
    }

    const syncThumb = (pos: number, value: number) => {
        values[pos] = clamp(Math.round(value * (zone.max - zone.min) + zone.min))
        state.max = Math.max(values[0], values[1])
        state.min = Math.min(values[0], values[1])
        maxNum.value = String(state.max)
        minNum.value = String(state.min)
        updateUI()
    }

    bindThumb(slider, [thumb0, thumb1], (v, pos) => syncThumb(pos, v))
    syncMin(Number(init.min))
    syncMax(Number(init.max))
    minNum.addEventListener('input', () => syncMin(Number(minNum.value)))
    maxNum.addEventListener('input', () => syncMax(Number(maxNum.value)))
}

const STORAGE_KEY = 'snowing-config'

function loadConfig(init: Config): Config {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return init
    try {
        return JSON.parse(saved)
    } catch {
        return init
    }
}

interface InitProps {
    $el: JQuery<HTMLElement>
    init: Config
    zone: Zone
    onChange: <T extends keyof Config>(key: T, value: Config[T]) => void
}
function init({ $el, init, zone, onChange }: InitProps) {
    $el.find('.section').each((_, item) => {
        const key = item.dataset.param as keyof Config
        const type = item.dataset.type
        if (!key || !type) return
        switch (type) {
            case 'range':
                return setupRange({
                    item,
                    init: init[key] as number,
                    zone: zone[key],
                    onChange(value) {
                        onChange(key, value)
                    },
                })
            case 'double-range':
                return setupDoubleRange({
                    item,
                    init: init[key] as RangeValue,
                    zone: zone[key],
                    onChange(value) {
                        onChange(key, value)
                    },
                })
        }
    })
}

export interface SetupProps {
    init: Config
    zone: Zone
    onChange: (config: Config, needRebuild: boolean) => void
}
export default function setup({ init: c, zone, onChange }: SetupProps) {
    const config = loadConfig(c)
    const styleEl = document.createElement('style')
    styleEl.textContent = style
    document.head.appendChild(styleEl)
    chiiLib.ukagaka.addPanelTab({
        tab: 'snowing',
        label: '下雪了',
        type: 'custom',
        customContent: () => content,
        onInit: (_, $el) =>
            init({
                $el,
                init: config,
                zone,
                onChange(key, value) {
                    config[key] = value
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
                    onChange(config, key == 'total' || key == 'ratio')
                },
            } as InitProps),
    })
    return config
}
