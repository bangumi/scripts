/**
 * bgm-decodeEPs-editor: 章节列表编辑器
 */
import * as preact from "preact";

declare const $$webpack_dev: boolean;

namespace BgmEpisodesEditor {

    function appendStyle() {
        const style = document.createElement("style");
        style.textContent = `
table.episodes-editor-mono {
    table-layout: fixed;
    width: 45em;
}

table.episodes-editor-mono input {
    width: 100%;
}

table.episodes-editor-mono input:invalid {
    background-color: pink;
}

table.episodes-editor-mono th:nth-child(1),
table.episodes-editor-mono td:nth-child(1) {
    width: 3em;
}

table.episodes-editor-mono th:nth-child(2),
table.episodes-editor-mono td:nth-child(2),
table.episodes-editor-mono th:nth-child(3),
table.episodes-editor-mono td:nth-child(3) {
    width: 10em;
}

table.episodes-editor-mono th:nth-child(4),
table.episodes-editor-mono td:nth-child(4) {
    width: 2.5em;
}

table.episodes-editor-mono th:nth-child(5),
table.episodes-editor-mono td:nth-child(5) {
    width: 4em;
}
`.trim();
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
            console.log("applying", state);
            preact.render(<EpList current={state} pushState={pushState} popState={popState} />,
                tableContainer,
                tableContainer.firstElementChild);
            summary.value = encodeEpisodes(decodeEpisodes(state));
        }

        pushState(summary.value);
    }

    // 章节列表中的一项: 章节编号|原文标题|简体中文标题|时长|放送日期
    interface Ep {
        no: string;
        titleRaw: string;
        titleZh: string;
        duration: string;
        airDate: string;
    }

    /** 将章节列表转换为用于textarea# 的字符串 */
    const encodeEpisodes = (decodeEPs: Ep[]) => decodeEPs
        .map(e => [
            e.no || "",
            e.titleRaw || "",
            e.titleZh || "",
            e.duration || "",
            e.airDate || ""
        ].join("|"))
        .join("\n");

    const decodeEpisodes: (text: string) => Ep[] = text => text
        .split(/\n+/)
        .map(l => l.trim())
        .filter(l => l)
        .map(l => {
            const [no, titleRaw, titleZh, duration, airDate] = l.split("|");
            return { no, titleRaw, titleZh, duration, airDate };
        });

    interface EpListProps {
        pushState(newState: string): void;
        popState(): void;
        current: string;
    }

    const fields: (keyof Ep)[] = ["no", "titleRaw", "titleZh", "duration", "airDate"];

    class EpList extends preact.Component<EpListProps, never> {

        th() {
            return (
                <tr>
                    <th>章节编号</th>
                    <th>原文标题</th>
                    <th>简体中文标题</th>
                    <th>时长</th>
                    <th>放送日期</th>
                </tr>
            );
        }

        decodeEPs() {
            return decodeEpisodes(this.props.current);
        }

        tr() {
            return this.decodeEPs().map((ep, row) =>
                <tr>
                    {fields.map(f =>
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
            if (ev.key === "z"
                && ev.ctrlKey
                && !ev.altKey
                && !ev.shiftKey) {
                ev.preventDefault();
                this.props.popState();
            }
        }

        onPaste = (row: number, field: keyof Ep) => (ev: ClipboardEvent) => {

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

        onInput = (row: number, field: keyof Ep) => (ev: Event) => {
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

    export function init() {
        appendStyle();
        bindEvents();
    }
}

setTimeout(BgmEpisodesEditor.init);
