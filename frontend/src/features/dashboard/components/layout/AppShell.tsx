import {
    AppBar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material"
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded"
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded"
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded"
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded"
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded"
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded"
import TuneRoundedIcon from "@mui/icons-material/TuneRounded"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { ENV } from "../../../../config/env"
import { loadClusterMeta } from "../../utils/clusterMeta"

const DRAWER_WIDTH = 220

type Props = { children: React.ReactNode }

const NAV_ITEMS = [
    { label: "Vista general",      icon: <BarChartRoundedIcon fontSize="small" />,       to: "/" },
    { label: "Alertas de riesgo",  icon: <DashboardRoundedIcon fontSize="small" />,      to: "/alerts" },
    { label: "Analítica de cursos",icon: <InsightsRoundedIcon fontSize="small" />,       to: "/clusters" },
    { label: "Comparador",         icon: <CompareArrowsRoundedIcon fontSize="small" />,  to: "/compare" },
    { label: "Notas",              icon: <NoteAltRoundedIcon fontSize="small" />,        to: "/notes" },
    { label: "Modelo predictivo",  icon: <PsychologyRoundedIcon fontSize="small" />,     to: "/model" },
]

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
    "/":         { title: "Vista general",       subtitle: "KPIs del curso y distribución de estudiantes" },
    "/alerts":   { title: "Alertas de riesgo",   subtitle: "Estudiantes con baja actividad o caída de engagement" },
    "/clusters": { title: "Analítica de cursos", subtitle: "Perfiles de aprendizaje y evolución por cluster" },
    "/compare":  { title: "Comparador",          subtitle: "Trayectorias de estudiantes lado a lado" },
    "/notes":    { title: "Notas de estudiantes",subtitle: "Registro de comentarios docentes" },
    "/model":    { title: "Modelo predictivo",   subtitle: "Evaluación del clasificador de resultados académicos" },
    "/settings": { title: "Configuración",       subtitle: "Ajusta los pesos del modelo de riesgo" },
}

export default function AppShell({ children }: Props) {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => { loadClusterMeta(ENV.API_URL) }, [])

    // Para la página de trayectoria no hay entrada fija
    const pageKey = location.pathname.startsWith("/trajectory")
        ? "/trajectory"
        : location.pathname
    const pageInfo = PAGE_TITLES[pageKey] ?? { title: "OULAD Analytics", subtitle: "" }

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <Drawer
                variant="permanent"
                className="no-print"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: DRAWER_WIDTH,
                        boxSizing: "border-box",
                        borderRight: "none",
                        background: "linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)",
                        color: "#fff",
                        borderRadius: 0,
                    },
                }}
            >
                {/* Logo */}
                <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.1, color: "#fff" }}>
                        OULAD Analytics
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.5, letterSpacing: 0.5 }}>
                        Visual Dashboard
                    </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 2 }} />

                <Box sx={{ px: 1.5, pt: 2, pb: 0.5 }}>
                    <Typography
                        variant="caption"
                        sx={{ letterSpacing: 1, opacity: 0.4, fontWeight: 700, pl: 1 }}
                    >
                        NAVEGACIÓN
                    </Typography>
                </Box>

                <List sx={{ px: 1, flex: 1 }}>
                    {NAV_ITEMS.map((item) => {
                        const active = location.pathname === item.to
                        return (
                            <ListItemButton
                                key={item.to}
                                component={Link}
                                to={item.to}
                                selected={active}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.25,
                                    py: 0.9,
                                    color: active ? "#fff" : "rgba(255,255,255,0.65)",
                                    bgcolor: active ? "rgba(59,130,246,0.2)" : "transparent",
                                    borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
                                    "&:hover": {
                                        bgcolor: "rgba(255,255,255,0.07)",
                                        color: "#fff",
                                    },
                                    transition: "all 0.15s",
                                }}
                            >
                                <ListItemIcon sx={{ color: "inherit", minWidth: 34 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500 }}
                                />
                            </ListItemButton>
                        )
                    })}
                </List>

                {/* Versión */}
                <Box sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
                    <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1.5 }} />
                    <Typography variant="caption" sx={{ opacity: 0.3, fontSize: 11 }}>
                        TFM · 2025
                    </Typography>
                </Box>
            </Drawer>

            {/* ── Área principal ────────────────────────────────────────── */}
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                {/* AppBar */}
                <AppBar
                    position="sticky"
                    color="inherit"
                    elevation={0}
                    className="no-print"
                    sx={{
                        borderBottom: "1px solid rgba(15,23,42,0.07)",
                        bgcolor: "#fff",
                        backdropFilter: "blur(10px)",
                        zIndex: 10,
                    }}
                >
                    <Toolbar sx={{ display: "flex", justifyContent: "space-between", minHeight: 60 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
                                {pageInfo.title}
                            </Typography>
                            {pageInfo.subtitle && (
                                <Typography variant="caption" color="text.secondary">
                                    {pageInfo.subtitle}
                                </Typography>
                            )}
                        </Box>

                        <Tooltip title="Configuración del modelo de riesgo">
                            <IconButton
                                onClick={() => navigate("/settings")}
                                size="small"
                                sx={{
                                    color: location.pathname === "/settings" ? "primary.main" : "text.secondary",
                                    bgcolor: location.pathname === "/settings" ? "primary.50" : "transparent",
                                    border: "1px solid",
                                    borderColor: location.pathname === "/settings"
                                        ? "primary.200"
                                        : "rgba(15,23,42,0.1)",
                                    "&:hover": { bgcolor: "rgba(59,130,246,0.08)", borderColor: "primary.300" },
                                }}
                            >
                                <TuneRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </AppBar>

                {/* Contenido */}
                <Box sx={{ p: 3, flex: 1 }}>{children}</Box>
            </Box>
        </Box>
    )
}
