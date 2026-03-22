import { Grid } from "@mui/material"
import MetricCard from "../components/ui/MetricCard"
import type { AlertsResponse, ProfilesResponse } from "../../../types/api"

type Props = {
    profiles: ProfilesResponse | null
    alerts: AlertsResponse | null
}

export default function SummaryRow({ profiles, alerts }: Props) {
    const totalClusters = profiles?.profiles.length ?? 0
    const totalAlerts = alerts?.alerts.length ?? 0

    return (
        <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Clusters detectados"
                    value={totalClusters}
                    helper="Distribución por curso"
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                <MetricCard
                    label="Alertas visibles"
                    value={totalAlerts}
                    helper="Semana actual"
                />
            </Grid>
        </Grid>
    )
}