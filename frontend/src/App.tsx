import { BrowserRouter, Route, Routes } from "react-router-dom"
import DashboardPage from "./features/dashboard/pages/DashboardPage"
import StudentTrajectoryPage from "./features/dashboard/pages/StudentTrajectoryPage"
import ClustersPage from "./features/dashboard/pages/ClustersPage"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/clusters" element={<ClustersPage />} />
                <Route
                    path="/trajectory/:courseId/:userId"
                    element={<StudentTrajectoryPage />}
                />
            </Routes>
        </BrowserRouter>
    )
}