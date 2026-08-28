import { StrictMode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProvider } from 'convex/react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error('VITE_CONVEX_URL is required. Run `npx convex dev` first.')
}

const convex = new ConvexReactClient(convexUrl)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>,
)
