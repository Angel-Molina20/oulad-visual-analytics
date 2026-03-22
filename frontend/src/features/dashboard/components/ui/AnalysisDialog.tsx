import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from "@mui/material"
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
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{title}</DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    {subtitle ? (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    ) : null}

                    {conclusion ? (
                        <Alert severity="info" sx={{ alignItems: "center" }}>
                            <strong>Conclusión automática:</strong>&nbsp;{conclusion}
                        </Alert>
                    ) : null}

                    {!!insights.length && (
                        <Stack spacing={1}>
                            <Typography variant="h6">Hallazgos</Typography>
                            <InsightList items={insights} severity="info" />
                        </Stack>
                    )}

                    {!!recommendations.length && (
                        <Stack spacing={1}>
                            <Typography variant="h6">Recomendaciones</Typography>
                            <RecommendationList items={recommendations} severity="warning" />
                        </Stack>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    )
}