import { Outlet } from 'react-router-dom'
import GlassBackground from './GlassBackground'
import TopNav from './TopNav'

export default function Layout() {
  return (
    <div className="min-h-full pb-16">
      <GlassBackground />
      <TopNav />
      <Outlet />
    </div>
  )
}
