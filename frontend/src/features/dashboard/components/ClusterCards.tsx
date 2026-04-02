import { Card, CardContent, Grid, Typography, Chip, Stack, Box } from "@mui/material"
import type { ClusterLabel } from "../hooks/useClusterLabels"
import { outcomeLabel } from "../utils/outcomes"

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
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={800}>
                    Perfiles
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

                    const smallSample = typeof nCourse === "number" && nCourse > 0 && nCourse < 30

                    return (
                        <Card
                            variant="outlined"
                            onClick={() => onSelectCluster(isSelected ? null : c.cluster)}
                            sx={{
                                cursor: "pointer",
                                borderWidth: isSelected ? 2 : 1,
                                borderColor: isSelected ? "primary.main" : "rgba(15, 23, 42, 0.12)",
                                boxShadow: isSelected ? 2 : 0,
                                transition: "all 0.15s",
                            }}
                        >
                                <CardContent sx={{ p: 2.25 }}>
                                    <Stack spacing={1}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="overline" color="text.secondary">
                                                    C{c.cluster}
                                                </Typography>
                                                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.15 }}>
                                                    {c.label}
                                                </Typography>
                                            </Box>

                                            {typeof nCourse === "number" && (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={`n curso: ${nCourse}`}
                                                    sx={{ mt: 0.3 }}
                                                />
                                            )}
                                        </Stack>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {c.description}
                                        </Typography>

                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                            <Chip size="small" label={`Clicks/sem: ${fmt(clicks)}`} />
                                            <Chip size="small" label={`Recursos/sem: ${fmt(resources)}`} />
                                            <Chip size="small" label={`Diversidad/sem: ${fmt(resourceTypes)}`} />
                                        </Stack>

                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                            <Chip size="small" variant="outlined" label={`Variación semanal: σ ${fmt(c.clicks_std_mean)}`} />
                                            <Chip size="small" variant="outlined" label={`Resultado dominante: ${topOutcomeLabel}`} />
                                        </Stack>

                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                            <Chip size="small" variant="outlined" label={`${outcomeLabel("Pass")}: ${pct(pass)}`} />
                                            <Chip size="small" variant="outlined" label={`${outcomeLabel("Fail")}: ${pct(fail)}`} />
                                            <Chip size="small" label={`${outcomeLabel("Withdrawn")}: ${pct(withdrawn)}`} />
                                        </Stack>

                                        {c.reasons?.length ? (
                                            <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                                                {c.reasons.slice(0, 3).map((reason) => (
                                                    <Typography key={reason} variant="caption" color="text.secondary">
                                                        {reason}
                                                    </Typography>
                                                ))}
                                            </Stack>
                                        ) : null}

                                        {smallSample && (
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label="Muestra pequeña. Interpreta con cuidado"
                                                sx={{
                                                    borderColor: "#f9a825",
                                                    color: "#f9a825",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        )}

                                        <Typography variant="caption" color="text.secondary">
                                            {typeof nCourse === "number"
                                                ? `n global=${nGlobal} · σ clicks=${sigmaClicks.toFixed(1)}`
                                                : `n=${nGlobal} · σ clicks=${sigmaClicks.toFixed(1)}`}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                    )
                })}
            </Grid>
        </Box>
    )
}