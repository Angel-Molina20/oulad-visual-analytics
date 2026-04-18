import { useEffect, useState } from "react"
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    Grid,
    InputAdornment,
    Slider,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material"
import SaveRoundedIcon from "@mui/icons-material/SaveRounded"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import AppShell from "../components/layout/AppShell"
import SectionCard from "../components/ui/SectionCard"
import { useRiskConfig, DEFAULT_RISK_CONFIG, type RiskConfig } from "../hooks/useRiskConfig"

// ── Configuración de cada slider ─────────────────────────────────────────────
type WeightField = {
    key: keyof RiskConfig
    label: string
    tooltip: string
    color: string
}

const WEIGHT_FIELDS: WeightField[] = [
    {
        key: "w_drop_clicks",
        label: "Caída de clicks vs semana anterior",
        tooltip: "Penaliza cuando el alumno redujo significativamente su actividad respecto a la semana previa.",
        color: "#ef4444",
    },
    {
        key: "w_low_clicks",
        label: "Clicks en el 25% más bajo",
        tooltip: "Penaliza cuando el total de clicks del alumno está en el cuartil inferior del curso esa semana.",
        color: "#f59e0b",
    },
    {
        key: "w_low_events",
        label: "Eventos en el 25% más bajo",
        tooltip: "Penaliza cuando el número de eventos está en el cuartil inferior del curso.",
        color: "#f97316",
    },
    {
        key: "w_low_resources",
        label: "Recursos en el 25% más bajo",
        tooltip: "Penaliza cuando la diversidad de recursos visitados está en el cuartil inferior.",
        color: "#a855f7",
    },
]

// ── Formula preview ──────────────────────────────────────────────────────────
function FormulaPreview({ cfg }: { cfg: RiskConfig }) {
    const sum =
        cfg.w_drop_clicks + cfg.w_low_clicks + cfg.w_low_events + cfg.w_low_resources

    const sumColor = sum > 1.05 ? "#ef4444" : sum > 1.0 ? "#f59e0b" : "#22c55e"

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(15,23,42,0.03)",
                border: "1px solid rgba(15,23,42,0.08)",
                fontFamily: "monospace",
                fontSize: 13,
            }}
        >
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Fórmula del score de riesgo (0 – 1):
            </Typography>
            <Typography component="div" sx={{ fontFamily: "monospace", fontSize: 13, lineHeight: 1.8 }}>
                <span style={{ color: "#3b82f6" }}>risk</span> ={" "}
                <span style={{ color: "#ef4444" }}>{cfg.w_drop_clicks.toFixed(2)}</span> × drop_clicks
                {" + "}
                <span style={{ color: "#f59e0b" }}>{cfg.w_low_clicks.toFixed(2)}</span> × low_clicks
                {" + "}
                <span style={{ color: "#f97316" }}>{cfg.w_low_events.toFixed(2)}</span> × low_events
                {" + "}
                <span style={{ color: "#a855f7" }}>{cfg.w_low_resources.toFixed(2)}</span> × low_resources
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                <Typography variant="caption" color="text.secondary">
                    Suma de pesos:
                </Typography>
                <Chip
                    label={sum.toFixed(2)}
                    size="small"
                    sx={{ bgcolor: sumColor, color: "#fff", fontWeight: 700, fontSize: 12 }}
                />
                {sum > 1.0 && (
                    <Typography variant="caption" sx={{ color: sumColor }}>
                        {sum > 1.05
                            ? "Los pesos suman más de 1 — el score se recortará a 1.0"
                            : "Ligeramente por encima de 1.0"}
                    </Typography>
                )}
            </Stack>
        </Box>
    )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function RiskConfigPage() {
    const { active, loading, saving, error, saved, save } = useRiskConfig()

    const [form, setForm] = useState<RiskConfig>({ ...DEFAULT_RISK_CONFIG })
    const [configName, setConfigName] = useState("manual")
    const [dirty, setDirty] = useState(false)

    // Inicializar form con la config activa cuando llega
    useEffect(() => {
        if (active) {
            setForm({
                name: active.name,
                w_drop_clicks: active.w_drop_clicks,
                w_low_clicks: active.w_low_clicks,
                w_low_events: active.w_low_events,
                w_low_resources: active.w_low_resources,
                drop_threshold: active.drop_threshold,
            })
            setConfigName(active.name)
            setDirty(false)
        }
    }, [active])

    const setWeight = (key: keyof RiskConfig, value: number) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setDirty(true)
    }

    const handleReset = () => {
        setForm({ ...DEFAULT_RISK_CONFIG })
        setConfigName("default")
        setDirty(true)
    }

    const handleSave = () => {
        save({ ...form, name: configName || "manual" })
        setDirty(false)
    }

    // ── Mapeo de umbrales de riesgo para la leyenda de referencia ────────────
    const riskLevels = [
        { label: "Alto", min: 0.75, color: "#ef4444" },
        { label: "Medio", min: 0.45, color: "#f59e0b" },
        { label: "Bajo", min: 0, color: "#22c55e" },
    ]

    return (
        <AppShell>
            <Container maxWidth="md" disableGutters sx={{ width: "100%" }}>
                <Stack spacing={3}>
                    {active && (
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Chip
                                label={`Config activa: ${active.name}`}
                                variant="outlined"
                                color="primary"
                                size="small"
                            />
                        </Box>
                    )}

                    {error && <Alert severity="error">{error}</Alert>}
                    {saved && (
                        <Alert severity="success" icon={<CheckCircleRoundedIcon />}>
                            Configuración guardada y activa correctamente.
                        </Alert>
                    )}

                    {/* Pesos */}
                    <SectionCard
                        title="Pesos de los indicadores"
                        subtitle="Cada valor controla cuánto impacta ese indicador en el score final (0 = sin efecto, 1 = máximo)"
                    >
                        <Stack spacing={3.5}>
                            {WEIGHT_FIELDS.map((field) => (
                                <Box key={field.key}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        mb={0.5}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {field.label}
                                            </Typography>
                                            <Tooltip title={field.tooltip} arrow placement="right">
                                                <InfoOutlinedIcon
                                                    sx={{ fontSize: 15, color: "text.disabled", cursor: "help" }}
                                                />
                                            </Tooltip>
                                        </Stack>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            sx={{ color: field.color, minWidth: 36, textAlign: "right" }}
                                        >
                                            {(form[field.key] as number).toFixed(2)}
                                        </Typography>
                                    </Stack>
                                    <Slider
                                        value={form[field.key] as number}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        onChange={(_, v) => setWeight(field.key, v as number)}
                                        sx={{
                                            color: field.color,
                                            "& .MuiSlider-thumb": { width: 18, height: 18 },
                                        }}
                                        marks={[
                                            { value: 0, label: "0" },
                                            { value: 0.5, label: "0.5" },
                                            { value: 1, label: "1" },
                                        ]}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </SectionCard>

                    {/* Umbral de caída */}
                    <SectionCard
                        title="Umbral de caída de clicks"
                        subtitle="Porcentaje mínimo de reducción de clicks respecto a la semana anterior para activar el indicador de caída"
                    >
                        <Box>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={0.5}
                            >
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Umbral de caída
                                    </Typography>
                                    <Tooltip
                                        title="Si la caída de clicks entre semanas supera este porcentaje, se activa el indicador de caída en el score."
                                        arrow
                                        placement="right"
                                    >
                                        <InfoOutlinedIcon
                                            sx={{ fontSize: 15, color: "text.disabled", cursor: "help" }}
                                        />
                                    </Tooltip>
                                </Stack>
                                <Typography variant="body2" fontWeight={700} sx={{ color: "#3b82f6" }}>
                                    {Math.round(form.drop_threshold * 100)}%
                                </Typography>
                            </Stack>
                            <Slider
                                value={form.drop_threshold}
                                min={0.05}
                                max={0.9}
                                step={0.05}
                                onChange={(_, v) => setWeight("drop_threshold", v as number)}
                                sx={{ color: "#3b82f6" }}
                                marks={[
                                    { value: 0.05, label: "5%" },
                                    { value: 0.3, label: "30%" },
                                    { value: 0.9, label: "90%" },
                                ]}
                            />
                        </Box>
                    </SectionCard>

                    {/* Preview de la fórmula */}
                    <SectionCard title="Vista previa de la fórmula">
                        <FormulaPreview cfg={form} />

                        <Divider />

                        {/* Niveles de riesgo fijos */}
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                Umbrales de clasificación del score (fijos):
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                {riskLevels.map((level) => (
                                    <Chip
                                        key={level.label}
                                        label={`${level.label} ≥ ${level.min}`}
                                        size="small"
                                        sx={{
                                            bgcolor: level.color,
                                            color: "#fff",
                                            fontWeight: 600,
                                            fontSize: 11,
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </SectionCard>

                    {/* Guardar */}
                    <SectionCard
                        title="Guardar configuración"
                        subtitle="Aplica los cambios al modelo de riesgo activo"
                    >
                        <Grid container spacing={2} alignItems="flex-end">
                            <Grid item xs={12} sm={7}>
                                <TextField
                                    label="Nombre de la configuración"
                                    value={configName}
                                    onChange={(e) => {
                                        setConfigName(e.target.value)
                                        setDirty(true)
                                    }}
                                    fullWidth
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Typography variant="caption" color="text.secondary">
                                                    #
                                                </Typography>
                                            </InputAdornment>
                                        ),
                                    }}
                                    helperText="Identificador para distinguir esta versión de la configuración"
                                />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        color="inherit"
                                        size="medium"
                                        onClick={handleReset}
                                        disabled={loading || saving}
                                        fullWidth
                                    >
                                        Restaurar por defecto
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="medium"
                                        startIcon={<SaveRoundedIcon />}
                                        onClick={handleSave}
                                        disabled={loading || saving || !dirty}
                                        fullWidth
                                    >
                                        {saving ? "Guardando…" : "Guardar"}
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>

                        {active?.created_at && (
                            <Typography variant="caption" color="text.secondary">
                                Última actualización:{" "}
                                {new Date(active.created_at).toLocaleString("es-ES")}
                            </Typography>
                        )}
                    </SectionCard>
                </Stack>
            </Container>
        </AppShell>
    )
}
