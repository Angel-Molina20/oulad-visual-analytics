import {
    Box,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material"

type Props = {
    courses: string[]
    courseId: string
    onCourseChange: (value: string) => void
    weekMode: "week" | "range"
    onWeekModeChange: (value: "week" | "range") => void
    weeks: number[]
    weekMin: number | null
    weekMax: number | null
    minWeekAvailable: number | null
    maxWeekAvailable: number | null
    onWeekMinChange: (value: number | null) => void
    onWeekMaxChange: (value: number | null) => void
}

export default function FiltersBar(props: Props) {
    const {
        courses,
        courseId,
        onCourseChange,
        weekMode,
        onWeekModeChange,
        weeks,
        weekMin,
        weekMax,
        minWeekAvailable,
        maxWeekAvailable,
        onWeekMinChange,
        onWeekMaxChange,
    } = props

    const minBound = minWeekAvailable ?? 0
    const maxBound = maxWeekAvailable ?? 0
    const rangeError = weekMode === "range" && weekMin !== null && weekMax !== null && weekMax < weekMin
    const selectedWeek = weekMax ?? weekMin ?? minWeekAvailable ?? ""

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2.5,
                border: "1px solid rgba(15,23,42,0.07)",
                background: "#fff",
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ md: "center" }}
                spacing={2}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Filtros:
                    </Typography>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={weekMode}
                        onChange={(_, value) => value && onWeekModeChange(value)}
                        sx={{ "& .MuiToggleButton-root": { py: 0.5, px: 1.5, fontSize: 12 } }}
                    >
                        <ToggleButton value="week">Semana</ToggleButton>
                        <ToggleButton value="range">Rango</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ flex: 1 }}>
                    <TextField
                        select
                        label="Curso"
                        value={courseId}
                        onChange={(e) => onCourseChange(e.target.value)}
                        fullWidth
                    >
                        {courses.map((c) => (
                            <MenuItem key={c} value={c}>
                                {c}
                            </MenuItem>
                        ))}
                    </TextField>

                    {weekMode === "week" ? (
                        <TextField
                            select={weeks.length > 0}
                            label="Semana"
                            type={weeks.length > 0 ? undefined : "number"}
                            inputProps={{ min: minBound, max: maxBound }}
                            value={selectedWeek}
                            onChange={(e) => {
                                const raw = e.target.value
                                const next = raw === "" ? null : Number(raw)
                                onWeekMinChange(next)
                                onWeekMaxChange(next)
                            }}
                            fullWidth
                        >
                            {weeks.map((w) => (
                                <MenuItem key={w} value={w}>
                                    Semana {w}
                                </MenuItem>
                            ))}
                        </TextField>
                    ) : (
                        <>
                            <TextField
                                label="Semana inicial"
                                type="number"
                                inputProps={{ min: minBound, max: maxBound }}
                                value={weekMin ?? ""}
                                onChange={(e) => {
                                    const raw = e.target.value
                                    onWeekMinChange(raw === "" ? null : Number(raw))
                                }}
                                helperText={
                                    minWeekAvailable !== null && maxWeekAvailable !== null
                                        ? `Rango disponible: ${minWeekAvailable}–${maxWeekAvailable}`
                                        : ""
                                }
                                error={rangeError}
                                fullWidth
                            />

                            <TextField
                                label="Semana final"
                                type="number"
                                inputProps={{ min: minBound, max: maxBound }}
                                value={weekMax ?? ""}
                                onChange={(e) => {
                                    const raw = e.target.value
                                    onWeekMaxChange(raw === "" ? null : Number(raw))
                                }}
                                helperText={
                                    rangeError
                                        ? "La semana final no puede ser menor que la inicial."
                                        : minWeekAvailable !== null && maxWeekAvailable !== null
                                            ? `Rango disponible: ${minWeekAvailable}–${maxWeekAvailable}`
                                            : ""
                                }
                                error={rangeError}
                                fullWidth
                            />
                        </>
                    )}
                </Stack>
            </Stack>
        </Paper>
    )
}
