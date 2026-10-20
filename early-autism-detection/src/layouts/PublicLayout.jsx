import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar, Footer } from '../components/layout'

export default function PublicLayout({ hideFooter = false }) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}