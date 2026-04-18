import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material"
import type { ReactNode } from "react"

type Props = {
    title: string
    subtitle?: string
    action?: ReactNode
    children: ReactNode
}

export default function SectionCard({ title, subtitle, action, children }: Props) {
    return (
        <Card
            elevation={0}
            sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                width: "100%",
                border: "1px solid rgba(15,23,42,0.07)",
                borderRadius: 2.5,
                overflow: "hidden",
            }}
        >
            {/* Header con fondo diferenciado */}
            <Box
                sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: "#f8fafc",
                    borderBottom: "1px solid rgba(15,23,42,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    flexShrink: 0,
                }}
            >
                <Stack spacing={0.25}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Stack>
                {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
            </Box>

            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack spacing={2} sx={{ flex: 1, width: "100%" }}>
                    {children}
                </Stack>
            </CardContent>
        </Card>
    )
}
