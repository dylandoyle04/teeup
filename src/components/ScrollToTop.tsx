import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Reset scroll to the top whenever the route changes, so a newly opened
// page (trip, package, scorecard…) starts at the top instead of inheriting
// the previous page's scroll position.
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
