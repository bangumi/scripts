import { createPortal } from 'react-dom'
import { cn } from '@/utils'
import { AsElement, Props as AsProps } from './AsElement'
import './Modal.css'

export function Modal({ className, children, ...props }: AsProps) {
    return createPortal(
        <AsElement className={cn('v-modal', className)} {...props}>
            <div className="modal-close" />
            {children}
        </AsElement>,
        document.body
    )
}
export default Modal
