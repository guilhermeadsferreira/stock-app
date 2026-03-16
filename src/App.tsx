import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from '@/router'
import { useAuthListener } from '@/application/hooks/useAuth'

function AuthSetup() {
  useAuthListener()
  return null
}

export function App() {
  return (
    <>
      <AuthSetup />
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
