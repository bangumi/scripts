export async function timeout(
    task: () => Promise<any>,
    ms: number,
    getCancle?: (cancle: () => void) => void
) {
    return new Promise<void>((resolve, reject) => {
        const rj = setTimeout(() => reject(), ms + 50)
        const id = setTimeout(() => {
            clearTimeout(rj)
            resolve()
        }, ms)
        getCancle?.(() => {
            clearTimeout(id)
            clearTimeout(rj)
        })
    })
        .then(() => task())
        .catch(() => {})
}
