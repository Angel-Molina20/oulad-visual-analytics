import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    Typography,
} from "@mui/material"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded"
import RecommendRoundedIcon from "@mui/icons-material/RecommendRounded"
import InsightList from "./InsightList"
import RecommendationList from "./RecommendationList"

type Props = {
    open: boolean
    onClose: () => void
    title: string
    subtitle?: string
    conclusion?: string
    insights?: string[]
    recommendations?: string[]
}

export default function AnalysisDialog({
    open,
    onClose,
    title,
    subtitle,
    conclusion,
    insights = [],
    recommendations = [],
}: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                elevation: 0,
                sx: {
                    border: "1px solid rgba(15,23,42,0.10)",
                    borderRadius: 3,
                },
            }}
        >
            {/* Header con acento */}
            <Box sx={{ height: 3, bgcolor: "#3b82f6", borderRadius: "12px 12px 0 0" }} />

            <DialogTitle sx={{ pb: 0.5, pr: 6 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ position: "absolute", right: 16, top: 16, color: "text.secondary" }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2.5 }}>
                <Stack spacing={3}>
                    {conclusion && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: "rgba(59,130,246,0.06)",
                                border: "1px solid rgba(59,130,246,0.18)",
                                borderLeft: "3px solid #3b82f6",
                            }}
                        >
                            <Typography variant="caption" fontWeight={700} sx={{ color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Conclusión automática
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: "text.primary" }}>
                                {conclusion}
                            </Typography>
                        </Box>
                    )}

                    {insights.length > 0 && (
                        <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <LightbulbRoundedIcon sx={{ fontSize: 16, color: "#6366f1" }} />
                                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                    Hallazgos
                                </Typography>
                            </Stack>
                            <InsightList items={insights} severity="info" />
                        </Stack>
                    )}

                    {recommendations.length > 0 && (
                        <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <RecommendRoundedIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                    Recomendaciones
                                </Typography>
                            </Stack>
                            <RecommendationList items={recommendations} severity="warning" />
                        </Stack>
                    )}
                </Stack>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose} variant="contained" disableElevation size="small">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    )
}
