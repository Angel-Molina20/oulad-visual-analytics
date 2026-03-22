import { BrowserRouter, Route, Routes } from "react-router-dom"
import DashboardPage from "./features/dashboard/pages/DashboardPage"
import StudentTrajectoryPage from "./features/dashboard/pages/StudentTrajectoryPage"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route
                    path="/trajectory/:courseId/:userId"
                    element={<StudentTrajectoryPage />}
                />
            </Routes>
        </BrowserRouter>
    )
}