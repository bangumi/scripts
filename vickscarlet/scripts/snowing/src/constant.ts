function range(start: number, end: number) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export const INIT = {
    total: 300,
    ratio: 30,
    speed: 50,
    rot: 20,
    snowSize: { min: 1, max: 5 },
    emojiSize: { min: 3, max: 10 },
}

export const ZONE = {
    total: { min: 0, max: 10000 },
    ratio: { min: 0, max: 100 },
    speed: { min: 0, max: 100 },
    rot: { min: 0, max: 100 },
    snowSize: { min: 1, max: 30 },
    emojiSize: { min: 1, max: 30 },
}

export const QUAD = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, -1],
    [1, 1],
    [-1, 1],
]

export const EMOJI_URLS = [
    ...range(1, 9).map((n) => `/img/smiles/bgm/0${n}.png`),
    '/img/smiles/bgm/10.png',
    '/img/smiles/bgm/11.gif',
    ...range(12, 22).map((n) => `/img/smiles/bgm/${n}.png`),
    '/img/smiles/bgm/23.gif',
    ...range(24, 32).map((n) => `/img/smiles/tv/0${n - 23}.gif`),
    ...range(33, 125).map((n) => `/img/smiles/tv/${n - 23}.gif`),
    ...range(200, 238).map((n) => `/img/smiles/tv_vs/bgm_${n}.png`),
    '/img/smiles/tv_500/bgm_500.gif',
    '/img/smiles/tv_500/bgm_501.gif',
    ...range(502, 504).map((n) => `/img/smiles/tv_500/bgm_${n}.png`),
    '/img/smiles/tv_500/bgm_505.gif',
    ...range(506, 514).map((n) => `/img/smiles/tv_500/bgm_${n}.png`),
    ...range(515, 519).map((n) => `/img/smiles/tv_500/bgm_${n}.gif`),
    '/img/smiles/tv_500/bgm_520.png',
    ...range(521, 523).map((n) => `/img/smiles/tv_500/bgm_${n}.gif`),
    ...range(524, 529).map((n) => `/img/smiles/tv_500/bgm_${n}.png`),
]
