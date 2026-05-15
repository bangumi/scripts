import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'

export const root = createRoot(document.createElement('div'))
export default root

export function rootPortal(...args: Parameters<typeof createPortal>) {
    createRoot(document.createElement('div')).render(createPortal(...args))
}

export function cn(...classList: (string | false | null | undefined)[]) {
    return classList.filter((className) => !!className).join(' ')
}

export function formatTime(time: Date) {
    const year = time.getFullYear()
    const month = (time.getMonth() + 1).toString().padStart(2, '0')
    const day = time.getDate().toString().padStart(2, '0')
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
}
