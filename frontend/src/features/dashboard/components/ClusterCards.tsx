import { Card, CardContent, Grid, Typography, Chip, Stack, Box, Divider } from "@mui/material"
import type { ClusterLabel } from "../hooks/useClusterLabels"
import { outcomeLabel } from "../utils/outcomes"
import { getClusterMeta } from "../utils/clusterMeta"

const TONE_COLORS: Record<string, string> = {
    success: "#22c55e",
    warning: "#f59e0b",
    error:   "#ef4444",
    default: "#64748b",
}

function pct(x: number) {
    return `${(x * 100).toFixed(1)}%`
}

function fmt(value: number | null | undefined, digits = 1) {
    return Number.isFinite(value) ? Number(value).toFixed(digits) : "-"
}

export default function ClusterCards({ clusters, selectedCluster, onSelectCluster }: { clusters: ClusterLabel[] | null, selectedCluster: number | null, onSelectCluster: (cluster: number | null) => void }) {
    if (!clusters?.length) return null

    const sorted = [...clusters].sort((a, b) => a.cluster - b.cluster)
    const courseId = sorted.find((c) => c.course_id)?.course_id
    const subtitle = courseId ? `Métricas del curso ${courseId}` : "Métricas globales"

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    Perfiles de actividad
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {subtitle}
                </Typography>
            </Stack>

            <Grid container spacing={2}>
                {sorted.map((c) => {
                    const clicks = c.clicks_mean_course ?? c.clicks_mean
                    const resources = c.resources_mean_course ?? c.resources_mean
                    const resourceTypes = c.resource_types_mean_course ?? c.resource_types_mean
                    const isSelected = selectedCluster === c.cluster
                    const pass = c.rate_pass_course ?? c.rate_pass
                    const fail = c.rate_fail_course ?? c.rate_fail
                    const withdrawn = c.rate_withdrawn_course ?? c.rate_withdrawn
                    const distinction = c.rate_distinction_course ?? c.rate_distinction

                    const outcomeRates: Record<string, number> = {
                        Pass: pass,
                        Fail: fail,
                        Withdrawn: withdrawn,
                        Distinction: distinction,
                    }
                    const topOutcome = Object.entries(outcomeRates).sort((a, b) => b[1] - a[1])[0]
                    const topOutcomeLabel = topOutcome ? `${outcomeLabel(topOutcome[0])} ${pct(topOutcome[1])}` : "-"

                    const nCourse = c.total_students_course
                    const nGlobal = c.total_students
                    const sigmaClicks = c.clicks_std_mean
                    const meta = getClusterMeta(c.cluster)
                    const toneColor = TONE_COLORS[meta.tone ?? "default"] ?? TONE_COLORS.default
                    const smallSample = typeof nCourse === "number" && nCourse > 0 && nCourse < 30

                    return (
                        <Grid item xs={12} sm={6} lg={3} key={c.cluster}>
                            <Card
                                elevation={0}
                                onClick={() => onSelectCluster(isSelected ? null : c.cluster)}
                                sx={{
                                    cursor: "pointer",
                                    border: isSelected ? `2px solid ${toneColor}` : "1px solid rgba(15,23,42,0.10)",
                                    borderTop: `3px solid ${toneColor}`,
                                    boxShadow: isSelected ? `0 0 0 3px ${toneColor}22` : "none",
                                    transition: "all 0.15s",
                                    height: "100%",
                                    "&:hover": { boxShadow: `0 2px 12px ${toneColor}30` },
                                }}
                            >
                                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                    <Stack spacing={1.25}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                    C{c.cluster}
                                                </Typography>
                                                <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.1 }}>
                                                    {c.label}
                                                </Typography>
                                            </Box>
                                            {typeof nCourse === "number" && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, flexShrink: 0 }}>
                                                    n={nCourse}
                                                </Typography>
                                            )}
                                        </Stack>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {c.description}
                                        </Typography>

                                        <Divider />

                                        {/* Métricas clave en grid compacto */}
                                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                                            {[
                                                { label: "Clicks/sem", value: fmt(clicks) },
                                                { label: "Recursos/sem", value: fmt(resources) },
                                                { label: "Diversidad/sem", value: fmt(resourceTypes) },
                                                { label: "σ clicks", value: fmt(sigmaClicks) },
                                            ].map(({ label, value }) => (
                                                <Box key={label}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                                                        {label}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                                        {value}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        <Divider />

                                        {/* Resultados */}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                                                Resultado dominante: <strong>{topOutcomeLabel}</strong>
                                            </Typography>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                {[
                                                    { key: "Pass", value: pass, color: "#1565c0" },
                                                    { key: "Fail", value: fail, color: "#c62828" },
                                                    { key: "Withdrawn", value: withdrawn, color: "#7b1fa2" },
                                                    { key: "Distinction", value: distinction, color: "#2e7d32" },
                                                ].map(({ key, value, color }) => (
                                                    <Box
                                                        key={key}
                                                        sx={{
                                                            px: 0.75,
                                                            py: 0.2,
                                                            borderRadius: 1,
                                                            border: `1px solid ${color}40`,
                                                            bgcolor: `${color}0d`,
                                                        }}
                                                    >
                                                        <Typography variant="caption" sx={{ color, fontWeight: 600, fontSize: 10 }}>
                                                            {outcomeLabel(key)} {pct(value)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>

                                        {smallSample && (
                                            <Typography variant="caption" sx={{ color: "#b45309" }}>
                                                ⚠ Muestra pequeña. Interpreta con cuidado.
                                            </Typography>
                                        )}

                                        <Typography variant="caption" color="text.disabled">
                                            {typeof nCourse === "number"
                                                ? `n global=${nGlobal}`
                                                : `n=${nGlobal}`}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    )
                })}
            </Grid>
        </Box>
    )
}