import { useMemo, useState } from "react"
import Plot from "react-plotly.js"
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
} from "@mui/material"
import SectionCard from "../components/ui/SectionCard"
import type { ProfilesResponse } from "../../../types/api"

export default function ProfilesPanel({ data }: { data: ProfilesResponse | null }) {
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(5)

    const safeProfiles = data?.profiles ?? []
    const safeOutcomes = data?.outcomes ?? []

    const clusterX = safeProfiles.map((r) => `C${r.cluster}`)
    const clusterY = safeProfiles.map((r) => r.students)

    const outcomeTotalsMap = safeOutcomes.reduce<Record<string, number>>((acc, item) => {
        const key = item.final_result || "Unknown"
        acc[key] = (acc[key] || 0) + item.students
        return acc
    }, {})

    const outcomeLabels = Object.keys(outcomeTotalsMap)
    const outcomeValues = Object.values(outcomeTotalsMap)

    const paginatedOutcomes = useMemo(() => {
        const start = page * rowsPerPage
        return safeOutcomes.slice(start, start + rowsPerPage)
    }, [safeOutcomes, page, rowsPerPage])

    if (!data) return null

    return (
        <Box
            sx={{
                display: "grid",
                gap: 2,
                width: "100%",
                gridTemplateColumns: {
                    xs: "1fr",
                    xl: "1.25fr 1fr 1.1fr",
                },
                alignItems: "stretch",
            }}
        >
            <Box sx={{ minWidth: 0, display: "flex" }}>
                <SectionCard
                    title="Distribución de clusters"
                    subtitle="Cantidad de estudiantes agrupados por perfil."
                >
                    <Plot
                        data={[
                            {
                                type: "bar",
                                x: clusterX,
                                y: clusterY,
                            },
                        ]}
                        layout={{
                            height: 320,
                            margin: { l: 50, r: 20, t: 10, b: 45 },
                            paper_bgcolor: "white",
                            plot_bgcolor: "white",
                        }}
                        style={{ width: "100%" }}
                        config={{ responsive: true, displayModeBar: false }}
                    />
                </SectionCard>
            </Box>

            <Box sx={{ minWidth: 0, display: "flex" }}>
                <SectionCard
                    title="Cruce cluster y resultado final"
                    subtitle="Vista tabular del comportamiento de cierre."
                >
                    <TableContainer
                        sx={{
                            border: "1px solid rgba(15, 23, 42, 0.06)",
                            borderRadius: 2,
                        }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: "#f8fafc", fontWeight: 700 }}>
                                        Cluster
                                    </TableCell>
                                    <TableCell sx={{ backgroundColor: "#f8fafc", fontWeight: 700 }}>
                                        Resultado
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{ backgroundColor: "#f8fafc", fontWeight: 700 }}
                                    >
                                        Estudiantes
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {paginatedOutcomes.map((r, idx) => (
                                    <TableRow key={`${r.cluster}-${r.final_result}-${idx}`} hover>
                                        <TableCell>C{r.cluster}</TableCell>
                                        <TableCell>{r.final_result}</TableCell>
                                        <TableCell align="right">{r.students}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={safeOutcomes.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(Number(e.target.value))
                            setPage(0)
                        }}
                        rowsPerPageOptions={[5, 10]}
                        labelRowsPerPage="Filas"
                        sx={{
                            ".MuiTablePagination-toolbar": {
                                minHeight: 44,
                                px: 1,
                            },
                        }}
                    />
                </SectionCard>
            </Box>

            <Box sx={{ minWidth: 0, display: "flex" }}>
                <SectionCard
                    title="Resultado final global"
                    subtitle="Distribución total por resultado académico."
                >
                    <Plot
                        data={[
                            {
                                type: "bar",
                                orientation: "h",
                                x: outcomeValues,
                                y: outcomeLabels,
                            },
                        ]}
                        layout={{
                            height: 320,
                            margin: { l: 110, r: 20, t: 10, b: 35 },
                            paper_bgcolor: "white",
                            plot_bgcolor: "white",
                        }}
                        style={{ width: "100%" }}
                        config={{ responsive: true, displayModeBar: false }}
                    />
                </SectionCard>
            </Box>
        </Box>
    )
}