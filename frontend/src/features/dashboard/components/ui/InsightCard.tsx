import { Card, CardContent, Stack, Typography } from "@mui/material"

type Props = {
    title: string
    value: string
    description?: string
}

export default function InsightCard({ title, value, description }: Props) {
    return (
        <Card sx={{ height: "100%" }}>
            <CardContent sx={{ py: 2 }}>
                <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary">
                        {title}
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {value}
                    </Typography>

                    {description ? (
                        <Typography variant="body2" color="text.secondary">
                            {description}
                        </Typography>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    )
}