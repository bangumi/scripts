# AGENTS.md

Guidance for writing userscripts in this directory (`inchei/`). Built from conventions observed in existing scripts.

## Lint & Build

```bash
pnpm lint        # eslint . && stylelint *.user.js
pnpm lint:fix    # auto-fix both
pnpm version     # check/align @version across scripts (before push)
```

- ESLint config enforces: 2-space indent, single quotes, semicolons, `object-curly-spacing: always`, trailing-comma-free.
- `stylelint` parses template-literal CSS inside `.user.js` (postcss-styled-syntax). CSS in `style.textContent` stays clean if written as one rule per template literal.
- `userscripts/no-invalid-headers` only allows extra header keys `gf` / `gadget`.
- Custom rule `eslint-rules/require-bangumi-domains.mjs`: if you list any bgm domain `@match`, you MUST list the corresponding path for all three domains (`bgm.tv`, `bangumi.tv`, `chii.in`) with the same protocol. `--fix` auto-completes them.

## Header conventions

```js
// ==UserScript==
// @name        中文名
// @namespace bangumi.<lower.dot.space.name>
// @version      0.1.0
// @description  一句话说明
// @author       you
// @icon         https://bgm.tv/img/favicon.ico
// @match        http*://bgm.tv/...
// @match        http*://bangumi.tv/...
// @match        http*://chii.in/...
// @run-at       document-idle
// @grant        none
// @license      MIT
// @gf
// ==/UserScript==
```

- `@match` path `*` matches across slashes, so `/person/*` covers `/person/1`, `/person/1/edit`, `/person/1/add_related/anime`.
- Wrap everything in `(function () { 'use strict'; ... })()`.
- **Dark mode**: bgm sets `html[data-theme="dark"]`. Don't hardcode bg/text colors in inline `style.cssText` on user-created elements — keep colors in a stylesheet and add `html[data-theme="dark"]` overrides (see `wikiCheckPersonPos` `position-*` rules, `wikiPersonRecycle` `#bgm-recycle-bar`).

## User-visible DOM (bgm wiki), confirmed live

- **Person page** `/person/{id}`: name is `.nameSingle a`. Modify row is inside `.modifyTool .tip_i` — the paragraph containing `a[href$="/edit"]` (fallback: `p:nth-of-type(2)`). Exists only when logged in; guest pages have no `.modifyTool`. Recent works: `.browserList` items with `.badge_job` (position) + `.ico_subject_type subject_type_{1,2,3,4,6}`. Full list at `/person/{id}/works` → `#browserItemList li#item_{subjectId}`.
- **Edit page** `/person/{id}/edit` (and `/subject/{id}/edit`): form fields `#subject_infobox` (wikitext), `#crt_name`, `#crt_summary`, `#editSummary`. The main form id is `#submitForm` on add_related pages; edit page forms may differ.
- **Infobox wcode**: when the wiki editor is in wcode mode, `window.nowmode === 'normal'`. Convert `NormaltoWCODE()` → edit `#subject_infobox.value` → `WCODEtoNormal()`; guard both with `typeof X === 'function'`. (Globals pre-whitelisted in eslint.config.mjs: `nowmode`, `NormaltoWCODE`, `WCODEtoNormal`, `subjectList`(writable), `addRelateSubject`, `findSubjectFunc`, `$`, `chiiLib`.)
- **别名 block** in infobox:
  ```
  |别名={
  [变体名]
  ...
  }
  ```
  To insert a bare alias: find line `^\|别名=\{$`, insert `[name]` right after it; if missing, create block after `|简体中文名=` line (or line 1). Dedupe by exact `[name]` line.

## add_related pages (`/subject/{id}/add_related/{person|character}`, `/person/{id}/add_related/{anime|book|music|game|real|person}`)

- Rows live in `<ul id="crtRelateSubjects"><li>`. Existing/saved rows have class `old`; freshly added rows do not — use this to detect "saved" state.
- Row anatomy: `.title a` (link to the related subject/person, id = last path segment), a `<select>` for position (value is the numeric prsnPos id), `input[name$="[appear_eps]"]` for 参与集数, a text input for remark, optional checkboxes.
- **Add a row programmatically** (the add-related.js / wikiVolToSeries pattern):
  ```js
  subjectList = [{ id: Number(id), type_id: <1|2|3|4|6|0>, name, name_cn: '', url_mod: 'subject'|'person' }];
  addRelateSubject(0, 'submitForm');   // PREPENDS the new <li> to #crtRelateSubjects (first child)
  // new row = document.querySelector('#crtRelateSubjects > li'); set its fields afterwards
  ```
  IMPORTANT: `addRelateSubject` **prepends** (new li becomes the first child), so grab `#crtRelateSubjects > li` (first), NOT an index from the pre-add count. Select the position via `li.querySelector('select[name$="[prsnPos]"]')` (person↔person uses `[rlt_type]`); then dispatch a `change` event. `type_id`: book=1, anime=2, music=3, game=4, real=6; use `0` + `url_mod:'person'` for person↔person relations.
- **Remove rows**: click each `a.h.rr` (remove link); fallback `li.remove()`. bgm saves by POSTing the current row list and diff-deletes what's missing, so removing the `<li>` from the DOM + submitting genuinely deletes.
- **Scrape the same-origin page without navigating**: `fetch(samePath)` + `new DOMParser()` + `querySelectorAll`. Login-gated pages return the guest/login page html — detect via `html.includes('当前操作需要您')` (see `wikiRelDiff`, `wikiPersonRecycle`).
- **IMPORTANT (person add_related)**: on `/person/{id}/add_related/{type}` the server HTML ships `#crtRelateSubjects` as an **empty `<ul>`** — rows are built client-side from an inline `var crtRelations = [...]` JSON array by `chiiLib.relations.prepareRelationList(...)`. So scraping must parse that JS variable, NOT querySelector the `<li>`s (they don't exist in the raw HTML). Regex `var\s+crtRelations\s*=\s*(\[[\s\S]*?\]);?` + `JSON.parse`. Row objects use `subject_id`, `name`, `url_mod`, `prsn_position` (numeric), `prsn_appear_eps`, `summary`, `id`; person↔person rows use `id`, `name`, `rlt_type`, `rlt_ended`. (Subject `/subject/{id}/add_related/person` pages DO server-render `li.old` — the two differ.)
- Page globals `subjectList` / `addRelateSubject` exist on these pages; if absent you're not logged in.

## Multi-page pipeline patterns (see `wikiPersonRecycle.user.js`)

- Persist state in `sessionStorage` (per-tab; dies with the tab). Read/write/clear via tiny helpers with `try/catch` JSON.
- A **submitted-marker**: on `form#submitForm` `submit` event, write `{step, ts}` to storage, then on the next page load (reload or redirect target) verify whether the step actually completed (e.g. all rows now have `.old`, or a target condition) before advancing. Fallback: a user button that force-advances.
- Design so every handler is **idempotent**: re-running the same step is a no-op or just refills — this makes "redirect landed somewhere unexpected" recoverable by re-navigating back into the pipeline.
- "Exit means abort": if a job exists but the current URL isn't a valid step page, clear the job and alert.

## Docker / env notes

None specific to this directory. Repo root has the main AGENTS.md; this file only concerns `inchei/`.