import { Box, Grid, Skeleton, Stack } from "@mui/material"

// ── Tarjeta métrica skeleton ─────────────────────────────────────────────────
export function MetricCardSkeleton() {
    return (
        <Box
            sx={{
                bgcolor: "#fff",
                borderRadius: 2.5,
                border: "1px solid rgba(15,23,42,0.07)",
                overflow: "hidden",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
        >
            <Skeleton variant="rectangular" height={3} sx={{ bgcolor: "rgba(15,23,42,0.07)" }} />
            <Box sx={{ p: 2.5, flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Skeleton variant="text" width="55%" height={18} />
                    <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: 1.5 }} />
                </Stack>
                <Skeleton variant="text" width="40%" height={36} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="70%" height={14} />
            </Box>
        </Box>
    )
}

// ── Fila de 4 tarjetas métricas skeleton ─────────────────────────────────────
export function SummaryRowSkeleton() {
    return (
        <Grid container spacing={2} alignItems="stretch">
            {[0, 1, 2, 3].map((i) => (
                <Grid item xs={12} sm={6} md={3} key={i} sx={{ display: "flex" }}>
                    <MetricCardSkeleton />
                </Grid>
            ))}
        </Grid>
    )
}

// ── Tabla skeleton (N filas) ─────────────────────────────────────────────────
export function TableSkeleton({ rows = 6, cols = 7 }: { rows?: number; cols?: number }) {
    return (
        <Box sx={{ border: "1px solid rgba(15,23,42,0.06)", borderRadius: 2, overflow: "hidden" }}>
            {/* Header */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    bgcolor: "#f8fafc",
                    borderBottom: "2px solid rgba(15,23,42,0.08)",
                    px: 2,
                    py: 1.25,
                    gap: 2,
                }}
            >
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} variant="text" height={14} width="60%" />
                ))}
            </Box>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, ri) => (
                <Box
                    key={ri}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        px: 2,
                        py: 1.25,
                        gap: 2,
                        borderBottom: ri < rows - 1 ? "1px solid rgba(15,23,42,0.04)" : undefined,
                    }}
                >
                    {Array.from({ length: cols }).map((_, ci) => (
                        <Skeleton key={ci} variant="text" height={16} width={ci === 0 ? "80%" : "50%"} />
                    ))}
                </Box>
            ))}
        </Box>
    )
}

// ── Chart placeholder skeleton ───────────────────────────────────────────────
export function ChartSkeleton({ height = 280 }: { height?: number }) {
    return (
        <Box sx={{ position: "relative", height, borderRadius: 2, overflow: "hidden" }}>
            <Skeleton variant="rectangular" width="100%" height="100%" />
            {/* Fake axes */}
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", p: 2 }}>
                <Stack direction="row" spacing={1} justifyContent="center">
                    {[80, 55, 65, 45, 70, 40, 60].map((w, i) => (
                        <Skeleton key={i} variant="rectangular" width={w} height={`${w}%`} sx={{ borderRadius: 1 }} />
                    ))}
                </Stack>
            </Box>
        </Box>
    )
}

// ── Cluster cards skeleton ───────────────────────────────────────────────────
export function ClusterCardsSkeleton() {
    return (
        <Grid container spacing={2}>
            {[0, 1, 2, 3].map((i) => (
                <Grid item xs={12} sm={6} lg={3} key={i}>
                    <Box
                        sx={{
                            bgcolor: "#fff",
                            borderRadius: 2,
                            border: "1px solid rgba(15,23,42,0.10)",
                            borderTop: "3px solid rgba(15,23,42,0.08)",
                            p: 2,
                            height: 260,
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Stack spacing={0.5}>
                                    <Skeleton variant="text" width={30} height={12} />
                                    <Skeleton variant="text" width={100} height={18} />
                                </Stack>
                                <Skeleton variant="text" width={30} height={14} />
                            </Stack>
                            <Skeleton variant="text" width="90%" height={13} />
                            <Skeleton variant="text" width="70%" height={13} />
                            <Skeleton variant="rectangular" height={1} sx={{ my: 0.5 }} />
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                                {[0, 1, 2, 3].map((j) => (
                                    <Stack key={j} spacing={0.25}>
                                        <Skeleton variant="text" width="60%" height={11} />
                                        <Skeleton variant="text" width="40%" height={16} />
                                    </Stack>
                                ))}
                            </Box>
                        </Stack>
                    </Box>
                </Grid>
            ))}
        </Grid>
    )
}
