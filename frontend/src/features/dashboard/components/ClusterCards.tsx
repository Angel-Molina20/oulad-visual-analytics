import { Card, CardContent, Grid, Typography, Chip, Stack } from "@mui/material"
import type { ClusterLabel } from "../hooks/useClusterLabels"

function pct(x: number) {
    return `${(x * 100).toFixed(1)}%`
}

export default function ClusterCards({ clusters }: { clusters: ClusterLabel[] | null }) {
    if (!clusters?.length) return null

    const sorted = [...clusters].sort((a, b) => a.cluster - b.cluster)

    return (
        <Grid container spacing={2}>
            {sorted.map((c) => (
                <Grid item xs={12} md={4} key={c.cluster}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="overline" color="text.secondary">
                                C{c.cluster}
                            </Typography>

                            <Typography variant="h6" fontWeight={800} gutterBottom>
                                {c.label}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {c.description}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip size="small" label={`Clicks/sem: ${c.clicks_mean.toFixed(1)}`} />
                                <Chip size="small" label={`Recursos/sem: ${c.resources_mean.toFixed(1)}`} />
                                <Chip size="small" label={`Withdrawn: ${pct(c.rate_withdrawn)}`} />
                            </Stack>

                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                n={c.total_students}, σ clicks={c.clicks_std_mean.toFixed(1)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    )
}