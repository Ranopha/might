import { Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { AppShell } from './components/navigation/AppShell'
import { ConnectionsScreen } from './screens/ConnectionsScreen'
import { FoundScreen } from './screens/FoundScreen'
import { MeScreen } from './screens/MeScreen'
import { TalkScreen } from './screens/TalkScreen'
import './App.css'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/talk" replace />} />
        <Route path="/talk" element={<TalkScreen />} />
        <Route path="/me" element={<MeScreen />} />
        <Route path="/found" element={<FoundScreen />} />
        <Route path="/connections" element={<ConnectionsScreen />} />
        <Route path="*" element={<Navigate to="/talk" replace />} />
      </Routes>
      </AppShell>
    </MotionConfig>
  )
}
