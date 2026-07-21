import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProjectsPage from "./pages/ProjectsPage";
import UploadPage from "./pages/UploadPage";
import ReviewPage from "./pages/ReviewPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<UploadPage />} />
        <Route path="/projects/:projectId/history" element={<HistoryPage />} />
        <Route path="/runs/:runId" element={<ReviewPage />} />
      </Route>
    </Routes>
  );
}
