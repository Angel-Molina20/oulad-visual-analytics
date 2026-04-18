import { BrowserRouter, Route, Routes } from "react-router-dom"
import DashboardPage from "./features/dashboard/pages/DashboardPage"
import StudentTrajectoryPage from "./features/dashboard/pages/StudentTrajectoryPage"
import ClustersPage from "./features/dashboard/pages/ClustersPage"
import StudentNotesPage from "./features/dashboard/pages/StudentNotesPage"
import ModelMetricsPage from "./features/dashboard/pages/ModelMetricsPage"
import OverviewPage from "./features/dashboard/pages/OverviewPage"
import RiskConfigPage from "./features/dashboard/pages/RiskConfigPage"
import StudentComparatorPage from "./features/dashboard/pages/StudentComparatorPage"
import { DashboardFiltersProvider } from "./features/dashboard/context/DashboardFiltersContext"

export default function App() {
    return (
        <BrowserRouter>
            <DashboardFiltersProvider>
                <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/alerts" element={<DashboardPage />} />
                    <Route path="/clusters" element={<ClustersPage />} />
                    <Route path="/notes" element={<StudentNotesPage />} />
                    <Route path="/model" element={<ModelMetricsPage />} />
                    <Route path="/settings" element={<RiskConfigPage />} />
                    <Route path="/compare" element={<StudentComparatorPage />} />
                    <Route
                        path="/trajectory/:courseId/:userId"
                        element={<StudentTrajectoryPage />}
                    />
                </Routes>
            </DashboardFiltersProvider>
        </BrowserRouter>
    )
}