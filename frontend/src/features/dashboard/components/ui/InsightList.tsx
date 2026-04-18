import { Box, Stack, Typography } from "@mui/material"
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import InfoRoundedIcon from "@mui/icons-material/InfoRounded"
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded"

type Props = {
    items: string[]
    severity?: "info" | "success" | "warning"
}

const SEVERITY_STYLES = {
    info:    { icon: InfoRoundedIcon,           color: "#3b82f6", bg: "rgba(59,130,246,0.05)",  border: "rgba(59,130,246,0.15)"  },
    success: { icon: CheckCircleRoundedIcon,    color: "#22c55e", bg: "rgba(34,197,94,0.05)",   border: "rgba(34,197,94,0.15)"   },
    warning: { icon: WarningAmberRoundedIcon,   color: "#f59e0b", bg: "rgba(245,158,11,0.05)",  border: "rgba(245,158,11,0.15)"  },
}

export default function InsightList({ items, severity = "info" }: Props) {
    if (!items.length) return null

    const { icon: Icon, color, bg, border } = SEVERITY_STYLES[severity]

    return (
        <Stack spacing={0.75}>
            {items.map((item, index) => (
                <Box
                    key={`${index}-${item}`}
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.25,
                        px: 1.5,
                        py: 1,
                        borderRadius: 1.5,
                        bgcolor: bg,
                        border: `1px solid ${border}`,
                    }}
                >
                    <Icon sx={{ fontSize: 16, color, mt: 0.15, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                        {item}
                    </Typography>
                </Box>
            ))}
        </Stack>
    )
}
