import Plot from "react-plotly.js"
import {
    Card,
    CardContent,
    Typography,
    Stack,
    TextField,
    MenuItem,
    Button,
} from "@mui/material"
import { useEffect, useMemo, useState } from "react"
import type { CohortsResponse } from "../../../types/api"
import { getClusterMeta } from "../utils/clusterMeta"

type Props = {
    data: CohortsResponse | null
    metric: string
    onMetric: (v: string) => void
    weekMin: number | null
    weekMax: number | null
    onApplyRange: (min: number | null, max: number | null) => void
    selectedCluster: number | null
}

const METRICS = [
    { key: "clicks_total", label: "Clicks" },
    { key: "resources_touched", label: "Recursos" },
    { key: "events_count", label: "Eventos" },
]

export default function CohortsPanel({ data, metric, onMetric, weekMin, weekMax, onApplyRange, selectedCluster }: Props) {
    // inputs locales (no disparan fetch)
    const [draftMin, setDraftMin] = useState<number | null>(weekMin)
    const [draftMax, setDraftMax] = useState<number | null>(weekMax)

    const isWeekMode = weekMin !== null && weekMax !== null && weekMin === weekMax
    const selectedWeek = weekMin ?? weekMax

    // si cambian desde fuera, sincroniza
    useEffect(() => {
        setDraftMin(weekMin)
        setDraftMax(weekMax)
    }, [weekMin, weekMax])

    const traces = useMemo(() => {
        if (!data?.series?.length) return []
        const clusters = Array.from(new Set(data.series.map((p) => p.cluster))).sort((a, b) => a - b)

        return clusters.map((c) => {
            const isSelected = selectedCluster !== null && selectedCluster === c
            const isDimmed = selectedCluster !== null && selectedCluster !== c
            const meta = getClusterMeta(c)
            const pts = data.series.filter((p) => p.cluster === c).sort((a, b) => a.week_id - b.week_id)
            return {
                type: "scatter",
                mode: "lines+markers",
                name: `${meta.code} · ${meta.label}`,
                x: pts.map((p) => p.week_id),
                y: pts.map((p) => p.value),
                hovertemplate: `Semana %{x}<br>${meta.label}: %{y:.2f}<extra></extra>`,
                line: {
                    width: isSelected ? 5 : 2,
                },
                marker: {
                    size: isSelected ? 8 : 5,
                    opacity: isDimmed ? 0.25 : 1,
                },
                opacity: isDimmed ? 0.25 : 1,
            } as any
        })
    }, [data, selectedCluster])

    const barTrace = useMemo(() => {
        if (!data?.series?.length || !isWeekMode || selectedWeek === null) return []
        const points = data.series
            .filter((p) => p.week_id === selectedWeek)
            .sort((a, b) => a.cluster - b.cluster)

        if (!points.length) return []

        const labels = points.map((p) => getClusterMeta(p.cluster).code)
        const colors = points.map((p) => {
            const tone = getClusterMeta(p.cluster).tone
            if (tone === "success") return "#2e7d32"
            if (tone === "warning") return "#f9a825"
            if (tone === "error") return "#d32f2f"
            return "#64748b"
        })
        const opacities = points.map((p) =>
            selectedCluster === null || selectedCluster === p.cluster ? 1 : 0.3
        )

        return [
            {
                type: "bar",
                x: labels,
                y: points.map((p) => p.value),
                marker: {
                    color: colors,
                    opacity: opacities,
                },
                hovertemplate: `Cluster %{x}<br>Valor: %{y:.2f}<extra></extra>`,
            } as any,
        ]
    }, [data, isWeekMode, selectedWeek, selectedCluster])

    const subtitle = isWeekMode && selectedWeek !== null
        ? `Comparación por cluster en la semana ${selectedWeek}.`
        : "Promedio semanal por perfil. Ajusta el rango y presiona Aplicar."

    const plotData = isWeekMode ? barTrace : traces

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                    sx={{ mb: 1 }}
                >
                    <div>
                        <Typography variant="h6" fontWeight={700}>
                            Cohortes por semana
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </div>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <TextField
                            select
                            size="small"
                            label="Métrica"
                            value={metric}
                            onChange={(e) => onMetric(e.target.value)}
                            sx={{ minWidth: 160 }}
                        >
                            {METRICS.map((m) => (
                                <MenuItem key={m.key} value={m.key}>
                                    {m.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            size="small"
                            label="Semana min"
                            type="number"
                            value={draftMin ?? ""}
                            onChange={(e) => setDraftMin(e.target.value === "" ? null : Number(e.target.value))}
                            sx={{ width: 130 }}
                            inputProps={{ min: 0 }}
                        />

                        <TextField
                            size="small"
                            label="Semana max"
                            type="number"
                            value={draftMax ?? ""}
                            onChange={(e) => setDraftMax(e.target.value === "" ? null : Number(e.target.value))}
                            sx={{ width: 130 }}
                            inputProps={{ min: 0 }}
                        />

                        <Button
                            variant="contained"
                            onClick={() => onApplyRange(draftMin, draftMax)}
                        >
                            Aplicar
                        </Button>
                    </Stack>
                </Stack>

                <Plot
                    data={plotData}
                    layout={{
                        height: 320,
                        margin: { l: 50, r: 10, t: 10, b: 40 },
                        legend: isWeekMode ? undefined : { orientation: "h", y: -0.25 },
                        barmode: isWeekMode ? "group" : undefined,
                    }}
                    style={{ width: "100%" }}
                    config={{ responsive: true, displayModeBar: false }}
                />
            </CardContent>
        </Card>
    )
}