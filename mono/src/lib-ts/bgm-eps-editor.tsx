/**
 * bgm-eps-editor: 章节列表编辑器
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

        const epsText = document.querySelector("#summary") as HTMLTextAreaElement;
        if (!epsText) {
            console.error("BgmEpisodesEditor: textarea#summary not found");
            return;
        }

        const tableContainer = document.createElement("div");
        epsText.parentElement.insertBefore(tableContainer, epsText);

        epsText.addEventListener("input", e => {
            if (e.isTrusted)
                setTimeout(() => updateComponent(form2eps(epsText.value)));
        });
        console.log("bindEvents() 2");

        let eps: Ep[];

        function updateComponent(newEps: Ep[]) {
            preact.render(<EpList eps={eps = newEps} setEps={updateComponent} />, tableContainer,
                tableContainer.firstElementChild);
            epsText.value = eps2form(newEps);
        }

        updateComponent(form2eps(epsText.value));

        console.log("bindEvents() done");
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
    const eps2form = (eps: Ep[]) => eps
        .map(e => [
            e.no || "",
            e.titleRaw || "",
            e.titleZh || "",
            e.duration || "",
            e.airDate || ""
        ].join("|"))
        .join("\n");

    const form2eps: (text: string) => Ep[] = text => text
        .split(/\n+/)
        .map(l => l.trim())
        .filter(l => l)
        .map(l => {
            const [no, titleRaw, titleZh, duration, airDate] = l.split("|");
            return { no, titleRaw, titleZh, duration, airDate };
        });

    interface EpListProps {
        setEps(eps: Ep[]): void;
        eps: Ep[];
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

        tr() {
            return this.props.eps.map((ep, row) =>
                <tr>
                    {fields.map(f =>
                        <td><input
                            pattern="[^|]*"
                            value={ep[f] || ""}
                            onPaste={this.onPaste(row, f)}
                            onInput={this.onInput(row, f)}
                        />
                        </td>)}
                </tr>);
        }

        onPaste = (row: number, field: keyof Ep) => (ev: ClipboardEvent) => {

            const newText = ev && ev.clipboardData && ev.clipboardData.getData("text") || "";
            if (!newText)
                return;

            const lines = newText.split("\n");
            if (lines.length < 2)
                return;

            ev.preventDefault();

            for (let r = row; r < this.props.eps.length && lines.length; r++) {
                const ep = this.props.eps[r];
                ep[field] = lines.shift();
            }

            this.props.setEps(this.props.eps);
        }

        onInput = (row: number, field: keyof Ep) => (ev: Event) => {
            const newText = ev && ev.target && (ev.target as HTMLInputElement).value || "";
            if (newText.includes("|")) return;

            const ep = this.props.eps[row];
            ep[field] = newText;
            this.props.setEps(this.props.eps);
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
        console.log("RUNNING", window);
        appendStyle();
        console.log("RUNNING 2", window);
        bindEvents();
        console.log("RUNNING 3", window);
    }
}

setTimeout(BgmEpisodesEditor.init());
