import { Card, CardContent, Stack, Typography } from "@mui/material"

type Props = {
    title: string
    subtitle?: string
    children: React.ReactNode
}

export default function SectionCard({ title, subtitle, children }: Props) {
    return (
        <Card sx={{ flex: 1, display: "flex", width: "100%" }}>
            <CardContent
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                }}
            >
                <Stack spacing={2} sx={{ flex: 1, width: "100%" }}>
                    <Stack spacing={0.5}>
                        <Typography variant="h6">{title}</Typography>
                        {subtitle ? (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Stack>

                    {children}
                </Stack>
            </CardContent>
        </Card>
    )
}