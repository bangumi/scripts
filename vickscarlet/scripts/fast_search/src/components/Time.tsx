export interface TimeProps {
    time: number
}

export function Time({ time }: TimeProps) {
    const date = new Date(time * 1000)
    return (
        <time dateTime={date.toISOString()}>
            {date.getFullYear()}-{(date.getMonth() + 1).toString().padStart(2, '0')}-
            {date.getDate().toString().padStart(2, '0')}{' '}
            {date.getHours().toString().padStart(2, '0')}:
            {date.getMinutes().toString().padStart(2, '0')}
        </time>
    )
}
