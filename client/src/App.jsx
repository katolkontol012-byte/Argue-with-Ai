import { useState } from 'react'
import DesktopSetup from './pages/DesktopSetup'
import DesktopArena from './pages/DesktopArena'

function App() {
  const [debateStarted, setDebateStarted] = useState(false)

  if (debateStarted) {
    return <DesktopArena onBack={() => setDebateStarted(false)} />
  }
  return <DesktopSetup onStart={() => setDebateStarted(true)} />
}

export default App
