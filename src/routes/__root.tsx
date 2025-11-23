import { SignOutButton } from '@/components/SignOutButton'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'

const RootLayout = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-primary">Advisement Scheduler</h2>
      </div>
      <SignOutButton />
    </header>
    <main className="flex-1 p-8">
      <Outlet />
    </main>
    <Toaster />
    <TanStackRouterDevtools />
  </div>
)

export const Route = createRootRoute({ component: RootLayout })