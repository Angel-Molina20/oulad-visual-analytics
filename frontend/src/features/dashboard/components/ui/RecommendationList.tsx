import { Alert, Stack } from "@mui/material"

type Props = {
    items: string[]
    severity?: "info" | "success" | "warning"
}

export default function RecommendationList({
                                               items,
                                               severity = "warning",
                                           }: Props) {
    if (!items.length) return null

    return (
        <Stack spacing={1}>
            {items.map((item, index) => (
                <Alert key={`${index}-${item}`} severity={severity}>
                    {item}
                </Alert>
            ))}
        </Stack>
    )
}