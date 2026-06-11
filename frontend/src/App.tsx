import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import WorkflowPage from './pages/WorkflowPage'
import OrderSummaryPage from './pages/OrderSummaryPage'
import StockVisibilityPage from './pages/StockVisibilityPage'
import ColdRoomPage from './pages/ColdRoomPage'
import AllocationPlanningPage from './pages/AllocationPlanningPage'
import BucketTrackerPage from './pages/BucketTrackerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/packhouse-dashboard" replace />} />
          <Route path="/packhouse" element={<WorkflowPage />} />
          <Route path="/packhouse-dashboard" element={<WorkflowPage />} />
          <Route path="/order-summary" element={<OrderSummaryPage />} />
          <Route path="/stock-visibility" element={<StockVisibilityPage />} />
          <Route path="/cold-room" element={<ColdRoomPage />} />
          <Route path="/sales-allocation-planning" element={<AllocationPlanningPage />} />
          <Route path="/bucket-tracker" element={<BucketTrackerPage />} />
          <Route path="*" element={<Navigate to="/packhouse-dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
