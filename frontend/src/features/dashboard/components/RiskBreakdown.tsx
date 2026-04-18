import { Box, Stack, Tooltip, Typography } from "@mui/material"
import type { AlertRow } from "../../../types/api"

function level(score: number) {
    if (score >= 0.75) return { label: "Alto", barColor: "#ef4444", textColor: "#b91c1c" }
    if (score >= 0.45) return { label: "Medio", barColor: "#f59e0b", textColor: "#b45309" }
    return { label: "Bajo", barColor: "#22c55e", textColor: "#15803d" }
}

export default function RiskBreakdown({ a }: { a: AlertRow }) {
    const s = a.risk_score ?? 0
    const L = level(s)
    const pct = Math.round(s * 100)
    const w = a.week_id
    const prevW = (a as any).prev_week
    const hasPrev = (a as any).has_prev === 1
    const assessmentEvents = a.assessment_events ?? 0
    const hasSubmission = (a.has_submission_week ?? 0) > 0
    const deltaClicks = a.clicks_delta_prev_week ?? 0
    const deltaDiversity = a.resource_diversity_delta ?? 0

    const tooltip = (
        <Stack spacing={0.5} sx={{ p: 0.5, maxWidth: 360 }}>
            <Typography variant="subtitle2" fontWeight={700}>
                Riesgo {L.label} · {pct}%
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

            <Typography variant="body2">
                Delta clicks: {deltaClicks >= 0 ? "+" : ""}{Math.round(deltaClicks)}
            </Typography>

            <Typography variant="body2">
                Delta diversidad: {deltaDiversity >= 0 ? "+" : ""}{Math.round(deltaDiversity)}
            </Typography>

            <Typography variant="body2">
                Evaluaciones: {assessmentEvents} · Entrega: {hasSubmission ? "Si" : "No"}
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
            <Box sx={{ minWidth: 90, cursor: "default" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.4 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: L.textColor, lineHeight: 1 }}>
                        {L.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: L.textColor, fontWeight: 600, lineHeight: 1 }}>
                        {pct}%
                    </Typography>
                </Stack>
                <Box
                    sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: "rgba(0,0,0,0.07)",
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            height: "100%",
                            width: `${pct}%`,
                            bgcolor: L.barColor,
                            borderRadius: 3,
                            transition: "width 0.3s ease",
                        }}
                    />
                </Box>
            </Box>
        </Tooltip>
    )
}