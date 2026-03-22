import {
    AppBar,
    Box,
    Chip,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
} from "@mui/material"
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded"

const drawerWidth = 225

type Props = {
    children: React.ReactNode
}

const items = [
    { label: "Resumen", icon: <DashboardRoundedIcon /> },
]

export default function AppShell({ children }: Props) {
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
                <Toolbar>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            Visual Analytics
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.75 }}>
                            OULAD dashboard
                        </Typography>
                    </Box>
                </Toolbar>

                <List sx={{ px: 1 }}>
                    {items.map((item) => (
                        <ListItemButton
                            key={item.label}
                            sx={{
                                borderRadius: 3,
                                mb: 0.5,
                                color: "rgba(255,255,255,0.9)",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
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
                        bgcolor: "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Box>
                            <Typography variant="h6" color="text.primary">
                                Panel de analítica visual
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Exploración de perfiles, alertas y trayectorias
                            </Typography>
                        </Box>

                        <Chip label="Activo" color="success" variant="outlined" />
                    </Toolbar>
                </AppBar>

                <Box sx={{ p: 3 }}>{children}</Box>
            </Box>
        </Box>
    )
}