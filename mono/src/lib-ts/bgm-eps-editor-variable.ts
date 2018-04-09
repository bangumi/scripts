export interface EditorSetting<Row> {
    getStyleText(): string;
    getColumnHeads(): string[];
    getColumnOrder(): (keyof Row)[];
}

// 章节列表中的一项: 章节编号|原文标题|简体中文标题|时长|放送日期
interface Episode {
    no: string;
    titleRaw: string;
    titleZh: string;
    duration: string;
    airDate: string;
}

// 曲目列表中的一项: 光盘编号|曲目编号|原文标题|简体中文标题|时长
interface Track {
    discNo: string;
    trackNo: string;
    titleRaw: string;
    titleZh: string;
    duration: string;
}

export function getSetting(): EditorSetting<any> {
    const sideContent: string = document.getElementById("columnB").textContent;
    if (/章节编号/.exec(sideContent)) {
        return new EpisodeEditor();
    } else if (/曲目编号/.exec(sideContent)) {
        return new TrackEditor();
    }
    throw new Error("cannot decide which editor to use");
}

class EpisodeEditor implements EditorSetting<Episode> {
    getStyleText = () => episodeStyleText;
    getColumnHeads = () => "章节编号|原文标题|简体中文标题|时长|放送日期".split("|");
    getColumnOrder = () => ["no", "titleRaw", "titleZh", "duration", "airDate"] as (keyof Episode)[];
}

class TrackEditor implements EditorSetting<Track> {
    getStyleText = () => trackStyleText;
    getColumnHeads = () => "光盘编号|曲目编号|原文标题|简体中文标题|时长".split("|");
    getColumnOrder = () => ["discNo", "titleNo", "titleRaw", "titleZh", "duration"] as (keyof Track)[];
}

const episodeStyleText = `
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
    width: 2em;
}

table.episodes-editor-mono th:nth-child(2),
table.episodes-editor-mono td:nth-child(2),
table.episodes-editor-mono th:nth-child(3),
table.episodes-editor-mono td:nth-child(3) {
    width: 10em;
}

table.episodes-editor-mono th:nth-child(4),
table.episodes-editor-mono td:nth-child(4) {
    width: 3.5em;
}

table.episodes-editor-mono th:nth-child(5),
table.episodes-editor-mono td:nth-child(5) {
    width: 4em;
}
`.trim();

const trackStyleText = `
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
table.episodes-editor-mono td:nth-child(1),
table.episodes-editor-mono th:nth-child(2),
table.episodes-editor-mono td:nth-child(2) {
    width: 2em;
}

table.episodes-editor-mono th:nth-child(3),
table.episodes-editor-mono td:nth-child(3),
table.episodes-editor-mono th:nth-child(4),
table.episodes-editor-mono td:nth-child(4) {
    width: 12em;
}

table.episodes-editor-mono th:nth-child(5),
table.episodes-editor-mono td:nth-child(5) {
    width: 4em;
}
`.trim();
