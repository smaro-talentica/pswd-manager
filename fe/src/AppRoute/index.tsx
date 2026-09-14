import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import { AuthSessionProvider } from '@/components/feature/AuthSession'
import { PwaInstallRoot } from '@/components/feature/PwaInstall'
import { Login } from '@/pages/Login'
import { PasswordManager } from '@/pages/PasswordManager'
import { SignUp } from '@/pages/SignUp'

function RootLayout() {
  return (
    <AuthSessionProvider>
      <PwaInstallRoot>
        <div className="min-h-dvh bg-background text-foreground">
          <Outlet />
        </div>
      </PwaInstallRoot>
    </AuthSessionProvider>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Login /> },
      { path: 'login', element: <Navigate to="/" replace /> },
      { path: 'signup', element: <SignUp /> },
      { path: 'password-manager', element: <PasswordManager /> },
    ],
  },
])

export default function AppRoute() {
  return <RouterProvider router={router} />
}
