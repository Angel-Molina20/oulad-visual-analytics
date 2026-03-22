import { Chip } from "@mui/material"

export default function RiskChip({ score }: { score: number }) {
    if (score >= 0.75) {
        return <Chip label={`Alto ${score.toFixed(2)}`} color="error" size="small" />
    }

    if (score >= 0.45) {
        return <Chip label={`Medio ${score.toFixed(2)}`} color="warning" size="small" />
    }

    return <Chip label={`Bajo ${score.toFixed(2)}`} color="success" size="small" />
}