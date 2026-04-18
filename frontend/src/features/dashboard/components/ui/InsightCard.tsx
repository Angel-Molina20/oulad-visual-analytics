import { Box, Typography } from "@mui/material"

type Props = {
    title: string
    value: string
    description?: string
    color?: string
}

export default function InsightCard({ title, value, description, color = "#6366f1" }: Props) {
    return (
        <Box
            sx={{
                bgcolor: "#fff",
                borderRadius: 2,
                border: "1px solid rgba(15,23,42,0.07)",
                borderLeft: `3px solid ${color}`,
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
        >
            <Typography
                variant="caption"
                fontWeight={600}
                sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    lineHeight: 1.2,
                }}
            >
                {title}
            </Typography>

            <Typography
                variant="h5"
                fontWeight={700}
                sx={{ color, lineHeight: 1.1, fontSize: { xs: "1.2rem", md: "1.4rem" } }}
            >
                {value}
            </Typography>

            {description && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ lineHeight: 1.4, mt: "auto" }}
                >
                    {description}
                </Typography>
            )}
        </Box>
    )
}
