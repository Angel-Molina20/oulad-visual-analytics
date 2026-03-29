import { Grid } from "@mui/material"
import MetricCard from "../components/ui/MetricCard"
import type { AlertsResponse, ProfilesResponse } from "../../../types/api"

type Props = {
    profiles: ProfilesResponse | null
    alerts: AlertsResponse | null
}

export default function SummaryRow({ profiles, alerts }: Props) {
    const totalClusters = profiles?.profiles.length ?? 0
    const totalStudents = profiles
        ? profiles.profiles.reduce((acc, item) => acc + item.students, 0)
        : 0
    const totalAlerts = alerts?.alerts.length ?? 0
    const highRiskAlerts = alerts
        ? alerts.alerts.filter((item) => item.risk_score >= 0.75).length
        : 0
    const avgRisk = alerts?.alerts.length
        ? alerts.alerts.reduce((acc, item) => acc + item.risk_score, 0) / alerts.alerts.length
        : 0

    const studentsValue = totalStudents > 0 ? `${totalStudents}` : "Sin datos"
    const studentsHelper = totalClusters > 0
        ? `Total en el curso: ${totalStudents}`
        : "Sin clusters detectados"

    const alertsValue = totalAlerts > 0 ? `${totalAlerts}` : "Sin alertas"
    const alertsHelper = totalAlerts > 0
        ? `Casos de riesgo alto: ${highRiskAlerts}`
        : "Semana actual sin casos"

    const highRiskRate = totalAlerts > 0
        ? `${Math.round((highRiskAlerts / totalAlerts) * 100)}%`
        : "-"
    const highRiskHelper = totalAlerts > 0
        ? "Proporción con riesgo alto"
        : "No hay alertas para estimar"

    const avgRiskValue = totalAlerts > 0 ? `${Math.round(avgRisk * 100)}%` : "-"
    const avgRiskHelper = totalAlerts > 0
        ? "Promedio de riesgo en la semana"
        : "No hay alertas para estimar"

    return (
        <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Estudiantes monitoreados"
                    value={studentsValue}
                    helper={studentsHelper}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Alertas priorizadas"
                    value={alertsValue}
                    helper={alertsHelper}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Riesgo alto"
                    value={highRiskRate}
                    helper={highRiskHelper}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Riesgo promedio"
                    value={avgRiskValue}
                    helper={avgRiskHelper}
                />
            </Grid>
        </Grid>
    )
}