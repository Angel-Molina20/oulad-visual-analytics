import { Box, Stack, Typography } from "@mui/material"
import type { ReactNode } from "react"

type Props = {
    label: string
    value: string | number
    helper?: string
    icon?: ReactNode
    color?: string
}

export default function MetricCard({ label, value, helper, icon, color = "#3b82f6" }: Props) {
    return (
        <Box
            sx={{
                bgcolor: "#fff",
                borderRadius: 2.5,
                border: "1px solid rgba(15,23,42,0.07)",
                overflow: "hidden",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
        >
            {/* Barra de color superior */}
            <Box sx={{ height: 3, bgcolor: color, flexShrink: 0 }} />

            <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {label}
                    </Typography>
                    {icon && (
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                bgcolor: `${color}15`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color,
                                flexShrink: 0,
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Stack>

                <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ color, lineHeight: 1, fontSize: { xs: "1.5rem", md: "1.75rem" } }}
                >
                    {value}
                </Typography>

                {helper && (
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {helper}
                    </Typography>
                )}
            </Box>
        </Box>
    )
}
