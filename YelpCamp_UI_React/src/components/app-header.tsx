import { Link, useNavigate } from '@tanstack/react-router'
import { AppLogo } from '@/components/app-logo'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { useFlashStore } from '@/stores/flash-store'

export function AppHeader() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const flash = useFlashStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    flash.success('Logged you out!')
    navigate({ to: '/campgrounds' })
  }

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" aria-label="YelpCamp home">
            <AppLogo />
          </Link>
          <Link
            to="/campgrounds"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Campgrounds
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                Signed in as <strong>{user.username}</strong>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
