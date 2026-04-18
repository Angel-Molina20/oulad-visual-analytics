type Column<T> = {
    label: string
    value: (row: T) => string | number | null | undefined
}

export function downloadCsv<T>(rows: T[], columns: Column<T>[], filename: string): void {
    const escape = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined) return ""
        const str = String(val)
        // Wrap in quotes if contains comma, quote or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    const header = columns.map((c) => escape(c.label)).join(",")
    const body   = rows.map((row) =>
        columns.map((c) => escape(c.value(row))).join(",")
    ).join("\n")

    // UTF-8 BOM so Excel opens tildes/ñ correctly
    const bom  = "\uFEFF"
    const blob = new Blob([bom + header + "\n" + body], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
