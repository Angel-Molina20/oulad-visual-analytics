import { Grid } from "@mui/material"
import MouseRoundedIcon from "@mui/icons-material/MouseRounded"
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded"
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded"
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded"
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded"
import MetricCard from "../components/ui/MetricCard"
import { SummaryRowSkeleton } from "../components/ui/Skeletons"
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

type Props = { summary: RangeSummary | null; loading?: boolean }

export default function SummaryRow({ summary, loading }: Props) {
    if (loading && !summary) return <SummaryRowSkeleton />
    const hasSummary = Boolean(summary)
    const rangeMin = summary?.rangeMin ?? 0
    const rangeMax = summary?.rangeMax ?? 0
    const isWeekMode = hasSummary && rangeMin === rangeMax

    const fmt = (value: number) =>
        new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)

    const weekLabel = isWeekMode ? `Semana ${rangeMin}` : `Sem. ${rangeMin}–${rangeMax}`

    // Clicks
    const clicksNum  = hasSummary ? (isWeekMode ? summary!.lastWeek?.clicksSum ?? 0 : summary!.totals.clicksSum) : 0
    const clicksVal  = hasSummary ? fmt(clicksNum) : "—"
    const clicksHelp = hasSummary ? `${weekLabel} · ${isWeekMode ? "clicks" : "acumulados"}` : "Sin datos"

    // Eventos
    const eventsNum  = hasSummary ? (isWeekMode ? summary!.lastWeek?.eventsSum ?? 0 : summary!.totals.eventsSum) : 0
    const eventsVal  = hasSummary ? fmt(eventsNum) : "—"
    const eventsHelp = hasSummary ? `${weekLabel} · ${isWeekMode ? "eventos" : "acumulados"}` : "Sin datos"

    // Recursos
    const resNum  = hasSummary ? (isWeekMode ? summary!.lastWeek?.resourcesAvg ?? 0 : summary!.totals.resourcesAvgPerWeek) : 0
    const resVal  = hasSummary ? fmt(resNum) : "—"
    const resHelp = hasSummary ? `${weekLabel} · ${isWeekMode ? "recursos" : "promedio semanal"}` : "Sin datos"

    // Tendencia
    const lastWeekClicks   = summary?.lastWeek?.clicksSum ?? 0
    const avgClicksPerWeek = summary?.totals.avgClicksPerWeek ?? 0
    const trend = avgClicksPerWeek > 0
        ? ((lastWeekClicks - avgClicksPerWeek) / avgClicksPerWeek) * 100
        : 0
    const trendUp    = trend >= 0
    const trendColor = trendUp ? "#22c55e" : "#ef4444"
    const trendHelp  = avgClicksPerWeek > 0
        ? `${trendUp ? "▲" : "▼"} ${Math.abs(trend).toFixed(0)}% vs promedio del curso`
        : "Sin datos de promedio"

    const statusVal  = hasSummary ? `Semana ${summary!.lastWeek?.week ?? rangeMax}` : "—"
    const clusterLbl = summary?.lastWeek?.topAlert ? getClusterMeta(summary.lastWeek.topAlert.cluster).label : null
    const statusHelp = hasSummary
        ? `${clusterLbl ? `Perfil top: ${clusterLbl}` : "Sin alertas"}`
        : "Sin datos"

    return (
        <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Clicks totales"
                    value={clicksVal}
                    helper={clicksHelp}
                    color="#3b82f6"
                    icon={<MouseRoundedIcon sx={{ fontSize: 18 }} />}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Eventos totales"
                    value={eventsVal}
                    helper={eventsHelp}
                    color="#6366f1"
                    icon={<TouchAppRoundedIcon sx={{ fontSize: 18 }} />}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Recursos (promedio)"
                    value={resVal}
                    helper={resHelp}
                    color="#14b8a6"
                    icon={<LibraryBooksRoundedIcon sx={{ fontSize: 18 }} />}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Tendencia de actividad"
                    value={statusVal}
                    helper={trendHelp}
                    color={hasSummary ? trendColor : "#94a3b8"}
                    icon={trendUp
                        ? <TrendingUpRoundedIcon sx={{ fontSize: 18 }} />
                        : <TrendingDownRoundedIcon sx={{ fontSize: 18 }} />
                    }
                />
            </Grid>
        </Grid>
    )
}
