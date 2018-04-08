/**
 * bgm-decodeEPs-editor: 章节列表编辑器
 */
import * as preact from "preact";
import { EditorSetting, getSetting } from "./bgm-eps-editor-variable";

declare const $$webpack_dev: boolean;

function BgmEpisodesEditor<T extends { [key: string]: string; }>(setting: EditorSetting<T>) {

    const columns = setting.getColumnOrder();
    const headers = setting.getColumnHeads();

    function appendStyle() {
        const style = document.createElement("style");
        style.textContent = setting.getStyleText();
        document.head.appendChild(style);
    }

    function bindEvents() {

        const summary = document.querySelector("#summary") as HTMLTextAreaElement;
        if (!summary) {
            console.error("BgmEpisodesEditor: textarea#summary not found");
            return;
        }

        const tableContainer = document.createElement("div");
        summary.parentElement.insertBefore(tableContainer, summary);

        summary.addEventListener("input", e => {
            if (e.isTrusted)
                setTimeout(() => pushState(summary.value));
        });

        const states: string[] = [];

        function popState() {
            if (states.length > 1) {
                states.pop();
                applyState(states[states.length - 1]);
            }
        }

        function pushState(newState: string) {
            if (newState !== states[states.length - 1])
                states.push(newState);
            while (states.length > 20)
                states.shift();
            applyState(newState);
        }

        function applyState(state: string) {
            // console.log("applying", state);
            preact.render(<EpList current={state} pushState={pushState} popState={popState} />,
                tableContainer,
                tableContainer.firstElementChild);
            summary.value = encodeEpisodes(decodeEpisodes(state));
        }

        pushState(summary.value);
    }

    /** 将章节列表转换为用于textarea# 的字符串 */
    const encodeEpisodes = (decodeEPs: T[]) => decodeEPs
        .map(e => columns.map(c => e[c] || "").join("|"))
        .join("\n");

    const decodeEpisodes: (text: string) => T[] = text => text
        .split(/\n+/)
        .map(l => l.trim())
        .filter(l => l)
        .map(l => {
            const values = l.split("|");
            return values.reduce((row, v, index) =>
                ((row[columns[index]] = v), row),
                {} as T);
        });

    interface EpListProps {
        pushState(newState: string): void;
        popState(): void;
        current: string;
    }

    class EpList extends preact.Component<EpListProps, never> {

        th() {
            return (
                <tr>
                    {headers.map(h => <th>{h}</th>)}
                </tr>
            );
        }

        decodeEPs() {
            return decodeEpisodes(this.props.current);
        }

        tr() {
            return this.decodeEPs().map((ep, row) =>
                <tr>
                    {columns.map(f =>
                        <td><input
                            pattern="[^|]*"
                            value={ep[f] || ""}
                            onKeyDown={this.onkeydown}
                            onPaste={this.onPaste(row, f)}
                            onInput={this.onInput(row, f)}
                        />
                        </td>)}
                </tr>);
        }

        onkeydown = (ev: KeyboardEvent) => {
            const isUndo = (ev.key === "z"
                && xor(ev.ctrlKey, ev.metaKey)
                && !ev.altKey
                && !ev.shiftKey);
            if (isUndo) {
                ev.preventDefault();
                this.props.popState();
            }
        }

        onPaste = (row: number, field: keyof T) => (ev: ClipboardEvent) => {

            const newText = ev && ev.clipboardData && ev.clipboardData.getData("text") || "";
            if (!newText)
                return;

            const lines = newText.split("\n");
            if (lines.length < 2)
                return;

            ev.preventDefault();

            const eps = this.decodeEPs();

            for (let r = row; r < eps.length && lines.length; r++) {
                const ep = eps[r];
                ep[field] = lines.shift();
            }

            this.props.pushState(encodeEpisodes(eps));
        }

        onInput = (row: number, field: keyof T) => (ev: Event) => {
            const newText = ev && ev.target && (ev.target as HTMLInputElement).value || "";
            if (newText.indexOf("|") !== -1) return;

            const eps = this.decodeEPs();
            eps[row][field] = newText;
            this.props.pushState(encodeEpisodes(eps));
        }

        render() {
            return (
                <table class="episodes-editor-mono">
                    {this.th()}
                    {this.tr()}
                </table>
            );
        }
    }

    return function init() {
        appendStyle();
        bindEvents();
    };
}

setTimeout(() => BgmEpisodesEditor(getSetting())());

function xor(b1: boolean, b2: boolean) {
    return !!(~~b1 ^ ~~b2);
}
