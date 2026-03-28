import { Chip, Stack, Tooltip, Typography } from "@mui/material"
import type { AlertRow } from "../../../types/api"

function level(score: number) {
    if (score >= 0.75) return { label: "Alto", color: "warning" as const }
    if (score >= 0.45) return { label: "Medio", color: "default" as const }
    return { label: "Bajo", color: "success" as const }
}

export default function RiskBreakdown({ a }: { a: AlertRow }) {
    const s = a.risk_score ?? 0
    const L = level(s)
    const w = a.week_id
    const prevW = (a as any).prev_week
    const hasPrev = (a as any).has_prev === 1

    const tooltip = (
        <Stack spacing={0.5} sx={{ p: 0.5, maxWidth: 360 }}>
            <Typography variant="subtitle2" fontWeight={700}>
                Riesgo {L.label} · {(s * 100).toFixed(0)}%
            </Typography>

            {(a.reasons || []).slice(0, 3).map((r, i) => (
                <Typography key={i} variant="body2">
                    {r}
                </Typography>
            ))}

            <Typography variant="caption" color="text.secondary">
                Evidencia
            </Typography>


            <Typography variant="body2">
                Clicks semana {w}: {a.clicks_total}
            </Typography>

            <Typography variant="body2">
                {hasPrev ? `Clicks semana ${prevW}: ${a.prev_clicks}` : "Sin semana anterior"}
            </Typography>


            {"drop_clicks_pct" in a && a.drop_clicks_pct != null && (
                <Typography variant="body2">
                    Caída clicks: {(a.drop_clicks_pct * 100).toFixed(0)}%
                </Typography>
            )}

            <Typography variant="body2">
                Umbral de baja actividad del curso: {a.p25_clicks}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Debajo de este valor, el estudiante está en el 25% con menos actividad esa semana.
            </Typography>
        </Stack>
    )

    return (
        <Tooltip title={tooltip} placement="left" arrow>
            <Chip
                size="small"
                label={`${L.label} · ${(s * 100).toFixed(0)}%`}
                variant="outlined"
                sx={{
                    borderColor:
                        L.label === "Alto" ? "#d32f2f" : L.label === "Medio" ? "#f9a825" : "#2e7d32",
                    color:
                        L.label === "Alto" ? "#d32f2f" : L.label === "Medio" ? "#f9a825" : "#2e7d32",
                    fontWeight: 700,
                }}
            />
        </Tooltip>
    )
}