import initConfig from './pages/config.ts'
import vs from './shaders/vertex.glsl?raw'
import fs from './shaders/fragment.glsl?raw'
import { ZONE, INIT, QUAD, EMOJI_URLS } from './constant.ts'

async function loadEmoji(src: string) {
    return new Promise<HTMLImageElement | null>((res) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = src
        img.onload = () => res(img)
        img.onerror = () => res(null)
    })
}

async function getEmojiAtlas(emojiUrls: string[], size = 21) {
    const atlas = document.createElement('canvas')
    const ctx = atlas.getContext('2d')
    if (!ctx) return { atlas, count: 0 }
    const imgs = await Promise.all(emojiUrls.map(loadEmoji))
    const valid = imgs.filter(Boolean) as HTMLImageElement[]
    if (!valid.length) return { atlas, count: 0 }
    atlas.width = size * valid.length
    atlas.height = size
    valid.forEach((img, i) => {
        const scale = Math.min(1, size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = i * size + (size - w) * 0.5
        const y = (size - h) * 0.5
        ctx.drawImage(img, x, y, w, h)
    })
    return { atlas, count: valid.length }
}

function getVertexAttribData(total: number, ratio: number, count: number) {
    const vertices = []
    const ids = []
    const types = []
    const texIndices = []

    const EC = Math.floor((total * ratio) / 100)
    for (let i = 0; i < total; i++) {
        const type = i < EC ? 1 : 0
        const texIndex = i < EC ? Math.floor(Math.random() * count) : 0
        for (let j = 0; j < 6; j++) {
            vertices.push(...QUAD[j])
            ids.push(i)
            types.push(type)
            texIndices.push(texIndex)
        }
    }
    return { vertices, ids, types, texIndices }
}

async function main() {
    let rebuild: () => void
    let reconfig: () => void
    let config = initConfig({
        init: INIT,
        zone: ZONE,
        onChange(newConfig, isRebuild) {
            config = newConfig
            if (isRebuild) rebuild?.()
            else reconfig?.()
        },
    })
    const canvas = document.createElement('canvas')
    Object.assign(canvas.style, {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
    })
    document.body.appendChild(canvas)

    const gl = canvas.getContext('webgl')
    if (!gl) return
    const program = gl.createProgram()

    const resize = () => {
        canvas.width = innerWidth
        canvas.height = innerHeight
        gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const attachShader = (type: number, src: string) => {
        const s = gl.createShader(type)
        if (!s) return
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(s))
        }
        gl.attachShader(program, s)
    }
    const bufferAttrib = (data: number[], name: string, size: number) => {
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(program, name)
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
    }
    attachShader(gl.VERTEX_SHADER, vs)
    attachShader(gl.FRAGMENT_SHADER, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
    }
    gl.useProgram(program)
    resize()
    addEventListener('resize', resize)
    const { atlas, count } = await getEmojiAtlas(EMOJI_URLS)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniform1f(gl.getUniformLocation(program, 'u_cols'), count)
    let vertexCount = 0
    const buildVertices = () => {
        const { vertices, ids, types, texIndices } = getVertexAttribData(
            config.total,
            config.ratio,
            count
        )
        bufferAttrib(vertices, 'a_pos', 2)
        bufferAttrib(ids, 'a_id', 1)
        bufferAttrib(types, 'a_type', 1)
        bufferAttrib(texIndices, 'a_texIndex', 1)
        vertexCount = ids.length
    }
    const setParameters = () => {
        gl.uniform1f(gl.getUniformLocation(program, 'u_snow_min'), config.snowSize.min)
        gl.uniform1f(gl.getUniformLocation(program, 'u_snow_max'), config.snowSize.max)
        gl.uniform1f(gl.getUniformLocation(program, 'u_emoji_min'), config.emojiSize.min)
        gl.uniform1f(gl.getUniformLocation(program, 'u_emoji_max'), config.emojiSize.max)
        gl.uniform1f(gl.getUniformLocation(program, 'u_fall_speed'), config.speed / 100 + 0.5)
        gl.uniform1f(gl.getUniformLocation(program, 'u_rot_speed'), config.rot / 33)
    }
    buildVertices()
    setParameters()
    const start = performance.now()
    const loop = (t: number) => {
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (t - start) / 1000)
        gl.uniform2f(gl.getUniformLocation(program, 'u_res'), canvas.width, canvas.height)
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount)
        requestAnimationFrame(loop)
    }
    loop(start)
    rebuild = buildVertices
    reconfig = setParameters
}
await main()
