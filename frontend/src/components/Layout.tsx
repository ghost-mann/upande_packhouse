import { Outlet, useLocation } from 'react-router-dom'
import GlassBackground from './GlassBackground'
import TopNav from './TopNav'
import ErrorBoundary from './ErrorBoundary'

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-full pb-16">
      <GlassBackground />
      <TopNav />
      <ErrorBoundary resetKey={pathname}>
        <Outlet />
      </ErrorBoundary>
    </div>
  )
}
