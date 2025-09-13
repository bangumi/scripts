interface GeneralConfigParams {
    title: string
    name: string
    type: string
    defaultValue: string
    getCurrentValue: () => void
    onChange: (value: string) => void
    options: { value: string; label: string }[]
}

var chiiLib: {
    ukagaka: {
        toggleTheme(): void
        toggleDisplay(): void
        addGeneralConfig(params: GeneralConfigParams): void
        removeGeneralConfig(params: any): void
        addPanelTab(params: any): void
        removePanelTab(params: any): void
    }
}
