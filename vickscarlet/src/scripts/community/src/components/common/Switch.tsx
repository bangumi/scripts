import { useState } from 'react'
import './Switch.css'

export interface Props {
    defaultEnabled: boolean
    onEnable?: () => void
    onDisable?: () => void
}

export function Switch({ defaultEnabled, onEnable, onDisable }: Props) {
    const [enabled, setEnabled] = useState(defaultEnabled)
    return (
        <div
            className="v-switch"
            data-enabled={enabled ? 'enabled' : 'disabled'}
            onClick={() => {
                const curr = !enabled
                setEnabled(curr)
                if (curr) onEnable?.()
                else onDisable?.()
            }}
        />
    )
}
export default Switch
