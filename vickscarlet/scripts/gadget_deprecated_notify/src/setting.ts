import { addStyle } from '@b38dev/dom'
import { db } from './db'
import css from './setting.css?inline'

export function addSettingPanel() {
    addStyle(css)
    chiiLib.ukagaka.addPanelTab({
        tab: 'gadget-deprecated-notify',
        label: '组件弃用提醒',
        type: 'custom',
        customContent: () =>
            `<div id="gadget-deprecated-notify-settings">
                <ul>
                    <li><button id="gadget-deprecated-notify-clear-dismiss"><span>清除已忽略记录</span></button></li>
                    <li><button id="gadget-deprecated-notify-clear-cache"><span>清除缓存</span></button></li>
                </ul>
            </div>`,
        onInit: (_, $el) => {
            const s = 'gadget-deprecated-notify-'
            $el.find<HTMLButtonElement>(`#${s}clear-dismiss`).on('click', async () => {
                await db.delete('values', 'dismissed')
                await db.delete('values', 'notified')
            })
            $el.find<HTMLButtonElement>(`#${s}clear-cache`).on('click', () =>
                db.delete('values', 'gadgets')
            )
        },
    })
}
