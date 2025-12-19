import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { StrictMode } from 'react'

const container = document.createElement('div')
document.body.appendChild(container)
createRoot(container).render(
    <StrictMode>
        <App timeout={500} />
    </StrictMode>
)
