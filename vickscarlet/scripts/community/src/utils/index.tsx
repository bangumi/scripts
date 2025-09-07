import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'

export const root = document.createElement('div')
export default root

export function rootPortal(...args: Parameters<typeof createPortal>) {
    createRoot(root).render(createPortal(...args))
}

export function cn(...classList: (string | false | null | undefined)[]) {
    return classList.filter((className) => !!className).join(' ')
}
