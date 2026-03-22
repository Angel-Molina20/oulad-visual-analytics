import { useMemo, useState } from "react"
import {
    Box,
    Button,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import SectionCard from "../components/ui/SectionCard"
import type { AlertsResponse } from "../../../types/api"
import RiskChip from "./RiskChip"

type RiskFilterValue = "all" | "high" | "medium" | "low"

type Props = {
    data: AlertsResponse | null
    courseId: string
}

export default function AlertsPanel({ data, courseId }: Props) {
    const navigate = useNavigate()

    const [studentFilter, setStudentFilter] = useState("")
    const [riskFilter, setRiskFilter] = useState<RiskFilterValue>("all")
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(8)

    const filteredRows = useMemo(() => {
        if (!data) return []

        return data.alerts.filter((a) => {
            const matchesStudent =
                !studentFilter.trim() || String(a.user_id).includes(studentFilter.trim())

            const matchesRisk =
                riskFilter === "all"
                    ? true
                    : riskFilter === "high"
                        ? a.risk_score >= 0.75
                        : riskFilter === "medium"
                            ? a.risk_score >= 0.45 && a.risk_score < 0.75
                            : a.risk_score < 0.45

            return matchesStudent && matchesRisk
        })
    }, [data, studentFilter, riskFilter])

    const paginatedRows = useMemo(() => {
        const start = page * rowsPerPage
        return filteredRows.slice(start, start + rowsPerPage)
    }, [filteredRows, page, rowsPerPage])

    const handleReset = () => {
        setStudentFilter("")
        setRiskFilter("all")
        setPage(0)
    }

    if (!data) return null

    return (
        <SectionCard
            title="Alertas semanales"
            subtitle="Revisión de estudiantes con mayor atención según su actividad y nivel de riesgo."
        >
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", lg: "center" }}
                >
                    <TextField
                        label="Estudiante"
                        placeholder="Ej. 11391"
                        value={studentFilter}
                        onChange={(e) => {
                            setStudentFilter(e.target.value)
                            setPage(0)
                        }}
                        fullWidth
                    />

                    <TextField
                        select
                        label="Riesgo"
                        value={riskFilter}
                        onChange={(e) => {
                            setRiskFilter(e.target.value as RiskFilterValue)
                            setPage(0)
                        }}
                        fullWidth
                    >
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="high">Alto</MenuItem>
                        <MenuItem value="medium">Medio</MenuItem>
                        <MenuItem value="low">Bajo</MenuItem>
                    </TextField>

                    <Button variant="outlined" onClick={handleReset} sx={{ minWidth: 140, height: 42 }}>
                        Limpiar
                    </Button>
                </Stack>

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Semana analizada: {data.week_id}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Resultados: {filteredRows.length}
                    </Typography>
                </Stack>

                <TableContainer sx={{ maxHeight: 560 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Estudiante</TableCell>
                                <TableCell align="right">Clicks</TableCell>
                                <TableCell align="right">Recursos</TableCell>
                                <TableCell align="right">Eventos</TableCell>
                                <TableCell align="right">Cluster</TableCell>
                                <TableCell>Resultado</TableCell>
                                <TableCell>Riesgo</TableCell>
                                <TableCell align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paginatedRows.map((a) => (
                                <TableRow key={`${a.user_id}-${a.week_id}`} hover>
                                    <TableCell>{a.user_id}</TableCell>
                                    <TableCell align="right">{a.clicks_total}</TableCell>
                                    <TableCell align="right">{a.resources_touched}</TableCell>
                                    <TableCell align="right">{a.events_count}</TableCell>
                                    <TableCell align="right">C{a.cluster}</TableCell>
                                    <TableCell>{a.final_result ?? "-"}</TableCell>
                                    <TableCell>
                                        <RiskChip score={a.risk_score} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => navigate(`/trajectory/${courseId}/${a.user_id}`)}
                                        >
                                            Ver trayectoria
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={filteredRows.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(Number(e.target.value))
                        setPage(0)
                    }}
                    rowsPerPageOptions={[5, 8, 10, 20]}
                    labelRowsPerPage="Filas por página"
                />
            </Stack>
        </SectionCard>
    )
}