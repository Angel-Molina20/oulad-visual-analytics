import { Grid } from "@mui/material"
import MetricCard from "../components/ui/MetricCard"
import { getClusterMeta } from "../utils/clusterMeta"
import type { AlertRow } from "../../../types/api"

type RangeSummary = {
    rangeMin: number
    rangeMax: number
    weeks: number[]
    weekSummaries: {
        week: number
        clicksSum: number
        eventsSum: number
        resourcesAvg: number
        topAlert: AlertRow | null
    }[]
    totals: {
        clicksSum: number
        eventsSum: number
        resourcesAvgPerWeek: number
        avgClicksPerWeek: number
    }
    lastWeek: {
        week: number
        clicksSum: number
        eventsSum: number
        resourcesAvg: number
        topAlert: AlertRow | null
    } | null
}

type Props = {
    summary: RangeSummary | null
}

export default function SummaryRow({ summary }: Props) {
    const hasSummary = Boolean(summary)
    const rangeMin = summary?.rangeMin ?? 0
    const rangeMax = summary?.rangeMax ?? 0
    const isWeekMode = hasSummary && rangeMin === rangeMax

    const formatNumber = (value: number) =>
        new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)

    const weekLabel = isWeekMode
        ? `Semana ${rangeMin}`
        : `Semanas ${rangeMin} a ${rangeMax}`

    const clicksValue = hasSummary
        ? `${formatNumber(isWeekMode ? summary!.lastWeek?.clicksSum ?? 0 : summary!.totals.clicksSum)} clicks`
        : "-"
    const clicksHelper = hasSummary
        ? `${weekLabel}, ${isWeekMode ? "actividad semanal" : "clicks acumulados"}`
        : "Sin datos"

    const eventsValue = hasSummary
        ? `${formatNumber(isWeekMode ? summary!.lastWeek?.eventsSum ?? 0 : summary!.totals.eventsSum)} eventos`
        : "-"
    const eventsHelper = hasSummary
        ? `${weekLabel}, ${isWeekMode ? "eventos de la semana" : "eventos acumulados"}`
        : "Sin datos"

    const resourcesValue = hasSummary
        ? `${formatNumber(isWeekMode ? summary!.lastWeek?.resourcesAvg ?? 0 : summary!.totals.resourcesAvgPerWeek)} recursos`
        : "-"
    const resourcesHelper = hasSummary
        ? isWeekMode
            ? `${weekLabel}, recursos de la semana`
            : `${weekLabel}, promedio semanal`
        : "Sin datos"

    const lastWeekLabel = summary?.lastWeek?.week ?? rangeMax
    const lastWeekClicks = summary?.lastWeek?.clicksSum ?? 0
    const avgClicksPerWeek = summary?.totals.avgClicksPerWeek ?? 0
    const trend = avgClicksPerWeek > 0
        ? ((lastWeekClicks - avgClicksPerWeek) / avgClicksPerWeek) * 100
        : 0
    const trendLabel = avgClicksPerWeek > 0
        ? `${trend >= 0 ? "Subida" : "Caida"} ${(Math.abs(trend)).toFixed(0)}% vs promedio`
        : "Sin promedio"

    const lastAlert = summary?.lastWeek?.topAlert ?? null
    const clusterLabel = lastAlert ? getClusterMeta(lastAlert.cluster) : null
    const riskLabel = lastAlert
        ? lastAlert.risk_score >= 0.75
            ? "Riesgo alto"
            : lastAlert.risk_score >= 0.45
                ? "Riesgo medio"
                : "Riesgo bajo"
        : "Riesgo no disponible"

    const statusValue = hasSummary
        ? `Semana ${lastWeekLabel}`
        : "-"
    const statusHelper = hasSummary
        ? `Clicks ${formatNumber(lastWeekClicks)} · ${trendLabel} · ${clusterLabel?.label ?? "Sin cluster"} · ${riskLabel}`
        : "Sin datos"

    return (
        <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Actividad total"
                    value={clicksValue}
                    helper={clicksHelper}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Interacciones totales"
                    value={eventsValue}
                    helper={eventsHelper}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Diversidad de uso"
                    value={resourcesValue}
                    helper={resourcesHelper}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Estado actual"
                    value={statusValue}
                    helper={statusHelper}
                />
            </Grid>
        </Grid>
    )
}