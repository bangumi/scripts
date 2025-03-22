import { expect, test } from 'vitest'
import { Router } from './router'

test('Router', () => {
    const router = new Router()
    router
        .use({
            pattern: '/user/:id',
            handler: (params: { id: string }) => ['用户页面', params.id],
        })
        .use({
            pattern: '/:type(anime|book|music|game)/tags',
            handler: ({ type }: { type: 'anime' | 'book' | 'music' | 'game' }) => [
                '频道标签',
                type,
            ],
        })
        .use({
            pattern: '/:type(anime|book|music|game)/list/:id',
            handler: ({ type, id }, path, pattern) => ['用户收藏', type, id, path, pattern],
            children: [
                {
                    pattern: '/:subtype',
                    handler: ({ type, id, subtype }) => ['用户收藏子类', type, id, subtype],
                },
            ],
        })
        .use({
            pattern: '/',
            handler: () => 'Home page',
        })

    expect(router.active('')).toBe('Home page')
    expect(router.active('/')).toBe('Home page')
    expect(router.active('/user/vickscarlet')).toStrictEqual(['用户页面', 'vickscarlet'])
    expect(router.active('/anime/list/vickscarlet')).toStrictEqual([
        '用户收藏',
        'anime',
        'vickscarlet',
        '/anime/list/vickscarlet',
        '/:type(anime|book|music|game)/list/:id',
    ])
    expect(router.active('/game/list/vickscarlet/wish')).toStrictEqual([
        '用户收藏子类',
        'game',
        'vickscarlet',
        'wish',
    ])
})
