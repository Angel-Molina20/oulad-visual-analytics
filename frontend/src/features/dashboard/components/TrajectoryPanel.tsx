import Plot from "react-plotly.js"
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material"
import SectionCard from "../components/ui/SectionCard"
import type { TrajectoryResponse } from "../../../types/api"

export default function TrajectoryPanel({ data }: { data: TrajectoryResponse | null }) {
    if (!data) return null

    const weeks = data.trajectory.map((t) => t.week_id)
    const clicks = data.trajectory.map((t) => t.clicks_total)
    const resources = data.trajectory.map((t) => t.resources_touched)

    return (
        <SectionCard
            title={`Trayectoria del estudiante ${data.user_id}`}
            subtitle="Evolución semanal de actividad académica."
        >
            <Plot
                data={[
                    {
                        type: "scatter",
                        mode: "lines+markers",
                        name: "Clicks",
                        x: weeks,
                        y: clicks,
                    },
                    {
                        type: "scatter",
                        mode: "lines+markers",
                        name: "Recursos",
                        x: weeks,
                        y: resources,
                    },
                ]}
                layout={{
                    height: 320,
                    margin: { l: 50, r: 20, t: 10, b: 40 },
                    paper_bgcolor: "white",
                    plot_bgcolor: "white",
                    legend: { orientation: "h", y: 1.15 },
                }}
                style={{ width: "100%" }}
                config={{ responsive: true, displayModeBar: false }}
            />

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell align="right">Semana</TableCell>
                            <TableCell align="right">Clicks</TableCell>
                            <TableCell align="right">Recursos</TableCell>
                            <TableCell align="right">Tipos</TableCell>
                            <TableCell align="right">Eventos</TableCell>
                            <TableCell align="right">Cluster</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {data.trajectory.slice(0, 20).map((t) => (
                            <TableRow key={t.week_id} hover>
                                <TableCell align="right">{t.week_id}</TableCell>
                                <TableCell align="right">{t.clicks_total}</TableCell>
                                <TableCell align="right">{t.resources_touched}</TableCell>
                                <TableCell align="right">{t.resource_types_touched}</TableCell>
                                <TableCell align="right">{t.events_count}</TableCell>
                                <TableCell align="right">C{t.cluster}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </SectionCard>
    )
}