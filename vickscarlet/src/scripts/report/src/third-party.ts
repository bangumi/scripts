import { loadScript } from '@common/dom'

declare global {
    function html2canvas(element: Node, options: any): Promise<HTMLCanvasElement>
}

export async function element2Canvas(element: Node) {
    await loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js')
    return html2canvas(element, {
        allowTaint: true,
        logging: false,
        backgroundColor: '#1c1c1c',
    })
}
