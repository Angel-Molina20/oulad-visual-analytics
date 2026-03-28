import {
    AppBar,
    Box,
    Chip,
    Divider,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
} from "@mui/material"
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded"
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded"
import { Link, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { ENV } from "../../../../config/env"
import { loadClusterMeta } from "../../utils/clusterMeta"

const drawerWidth = 225

type Props = {
    children: React.ReactNode
}

const items = [
    { label: "Resumen", icon: <DashboardRoundedIcon />, to: "/" },
    { label: "Analitica de cursos", icon: <InsightsRoundedIcon />, to: "/clusters" },
]

export default function AppShell({ children }: Props) {
    const location = useLocation()

    useEffect(() => {
        loadClusterMeta(ENV.API_URL)
    }, [])

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    borderRadius: 0,
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        borderRight: "1px solid rgba(15,23,42,0.08)",
                        background: "linear-gradient(180deg, #0f172a 0%, #172554 100%)",
                        color: "#fff",
                        borderRadius: 0,
                    },
                }}
            >
                <Toolbar sx={{ px: 2, py: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                            Visual Analytics
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.75 }}>
                            OULAD dashboard
                        </Typography>
                    </Box>
                </Toolbar>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                    <Typography variant="caption" sx={{ letterSpacing: 0.8, opacity: 0.7 }}>
                        Navegacion
                    </Typography>
                </Box>

                <List sx={{ px: 1 }}>
                    {items.map((item) => (
                        <ListItemButton
                            key={item.label}
                            component={Link}
                            to={item.to}
                            selected={location.pathname === item.to}
                            sx={{
                                borderRadius: 3,
                                mb: 0.5,
                                color: "rgba(255,255,255,0.9)",
                                border: "1px solid transparent",
                                "&.Mui-selected": {
                                    backgroundColor: "rgba(59,130,246,0.18)",
                                    borderColor: "rgba(59,130,246,0.5)",
                                },
                                "&.Mui-selected:hover": {
                                    backgroundColor: "rgba(59,130,246,0.24)",
                                },
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{ fontWeight: 600 }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Drawer>

            <Box sx={{ flexGrow: 1 }}>
                <AppBar
                    position="sticky"
                    color="inherit"
                    elevation={0}
                    sx={{
                        borderBottom: "1px solid rgba(15,23,42,0.08)",
                        bgcolor: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Box>
                            <Typography variant="h6" color="text.primary" fontWeight={700}>
                                Panel de analitica visual
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Exploracion de perfiles, alertas y trayectorias
                            </Typography>
                        </Box>

                        <Chip
                            label="Activo"
                            color="success"
                            variant="outlined"
                            sx={{ bgcolor: "rgba(34,197,94,0.08)" }}
                        />
                    </Toolbar>
                </AppBar>

                <Box sx={{ p: 3 }}>{children}</Box>
            </Box>
        </Box>
    )
}