import './Banner.css'

export interface BannerProps {
    banner?: React.ReactNode | null
}

export function Banner({ banner }: BannerProps) {
    return <>{banner && <div className="v-search-banner wide">{banner}</div>}</>
}

export default Banner
