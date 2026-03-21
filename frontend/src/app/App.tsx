import { useEffect, useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function App() {
    const [status, setStatus] = useState("cargando...")

    useEffect(() => {
        fetch(`${API}/health`)
            .then((r) => r.json())
            .then((j) => setStatus(j.status || "ok"))
            .catch(() => setStatus("error"))
    }, [])

    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL)

    return (
        <div style={{ fontFamily: "system-ui", padding: 24 }}>
            <h1>OULAD Visual Analytics</h1>
            <p>API: {API}</p>
            <p>Health: {status}</p>
        </div>
    )
}