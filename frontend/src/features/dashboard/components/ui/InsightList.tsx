import { Alert, Stack } from "@mui/material"

type Props = {
    items: string[]
    severity?: "info" | "success" | "warning"
}

export default function InsightList({ items, severity = "info" }: Props) {
    if (!items.length) return null

    return (
        <Stack spacing={1}>
            {items.map((item, index) => (
                <Alert key={`${index}-${item}`} severity={severity} variant="outlined">
                    {item}
                </Alert>
            ))}
        </Stack>
    )
}