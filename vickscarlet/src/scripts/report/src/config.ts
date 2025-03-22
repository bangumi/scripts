export const uid = /\/user\/(.+)?(\/.*)?/.exec(window.location.href)?.[1] || ''

export type Types = keyof typeof Types
export type SubTypes = keyof typeof SubTypes
export type AnimeTypes = keyof typeof AnimeTypeTimes

export const Types = {
    anime: { sort: 1, value: 'anime', name: '动画', action: '看', unit: '部' },
    game: { sort: 2, value: 'game', name: '游戏', action: '玩', unit: '部' },
    music: { sort: 3, value: 'music', name: '音乐', action: '听', unit: '张' },
    book: { sort: 4, value: 'book', name: '图书', action: '读', unit: '本' },
    real: { sort: 5, value: 'real', name: '三次元', action: '看', unit: '部' },
}

export const SubTypes = {
    collect: { sort: 1, value: 'collect', name: '$过', checked: true },
    do: { sort: 2, value: 'do', name: '在$', checked: false },
    dropped: { sort: 3, value: 'dropped', name: '抛弃', checked: false },
    on_hold: { sort: 4, value: 'on_hold', name: '搁置', checked: false },
    wish: { sort: 5, value: 'wish', name: '想$', checked: false },
}

export const AnimeTypeTimes = {
    WEB: 23 * 60 + 40,
    TV: 23 * 60 + 40,
    OVA: 45 * 60,
    OAD: 45 * 60,
    剧场版: 90 * 60,
}

export function formatSubType(subType: SubTypes, type: Types) {
    const action = Types[type].action
    return SubTypes[subType].name.replace('$', action)
}
