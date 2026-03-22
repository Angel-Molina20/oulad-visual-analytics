import { Card, CardContent, Stack, Typography } from "@mui/material"

type Props = {
    label: string
    value: string | number
    helper?: string
}

export default function MetricCard({ label, value, helper }: Props) {
    return (
        <Card sx={{ flex: 1, display: "flex" }}>
            <CardContent
                sx={{
                    flex: 1,
                    display: "flex",
                    py: 2.25,
                    "&:last-child": { pb: 2.25 },
                }}
            >
                <Stack justifyContent="space-between" sx={{ width: "100%", minHeight: 140 }}>
                    <Typography variant="body1" color="text.secondary">
                        {label}
                    </Typography>

                    <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
                        {value}
                    </Typography>

                    <Typography variant="body2" color="primary.main">
                        {helper ?? ""}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    )
}