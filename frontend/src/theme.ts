import { alpha, createTheme } from "@mui/material/styles"

export const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#1565c0",
        },
        secondary: {
            main: "#7b1fa2",
        },
        success: {
            main: "#2e7d32",
        },
        warning: {
            main: "#ed6c02",
        },
        error: {
            main: "#d32f2f",
        },
        background: {
            default: "#f5f7fb",
            paper: "#ffffff",
        },
        text: {
            primary: "#172033",
            secondary: "#5b6475",
        },
    },
    shape: {
        borderRadius: 10,
    },
    typography: {
        fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
        h3: {
            fontWeight: 800,
            letterSpacing: -0.8,
        },
        h4: {
            fontWeight: 700,
            letterSpacing: -0.4,
        },
        h5: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 700,
        },
        subtitle1: {
            fontWeight: 600,
        },
        button: {
            textTransform: "none",
            fontWeight: 700,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: "linear-gradient(180deg, #f8faff 0%, #f5f7fb 100%)",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundImage: "none",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    border: "1px solid rgba(15, 23, 42, 0.06)",
                    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    minHeight: 40,
                    borderRadius: 10,
                    paddingLeft: 14,
                    paddingRight: 14,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    backgroundColor: "#ffffff",
                },
                input: {
                    paddingTop: 12,
                    paddingBottom: 12,
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    "& .MuiTableCell-root": {
                        fontWeight: 700,
                        color: "#43506a",
                        backgroundColor: alpha("#1565c0", 0.04),
                    },
                },
            },
        },
    },
})