import {
    Box,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material"

type Props = {
    courses: string[]
    courseId: string
    onCourseId: (v: string) => void
    weekId: number
    onWeekId: (v: number) => void
    maxWeek: number
}

export default function FiltersBar(props: Props) {
    const { courses, courseId, onCourseId, weekId, onWeekId, maxWeek } = props

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid rgba(21, 101, 192, 0.08)",
                background: "#ffffff",
            }}
        >
            <Stack spacing={1.5}>
                <Box>
                    <Typography variant="subtitle1">Contexto de análisis</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Define el curso y la semana que quieres revisar.
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                        select
                        label="Curso"
                        value={courseId}
                        onChange={(e) => onCourseId(e.target.value)}
                        fullWidth
                    >
                        {courses.map((c) => (
                            <MenuItem key={c} value={c}>
                                {c}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Semana"
                        type="number"
                        inputProps={{ min: 0, max: maxWeek }}
                        value={weekId}
                        onChange={(e) => onWeekId(Number(e.target.value))}
                        fullWidth
                    />
                </Stack>
            </Stack>
        </Paper>
    )
}