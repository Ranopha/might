import { motion } from 'motion/react'
import { CompanionPresence } from '../components/companion/CompanionPresence'

const steps = ['Noticed', 'You agreed', 'Reached out', 'They replied', 'Connected']

export function ConnectionsScreen() {
  return (
    <section className="screen editorial-screen" aria-labelledby="connections-title">
      <header className="screen-topline">
        <span className="eyebrow">Human, eventually</span>
        <CompanionPresence compact />
      </header>

      <div className="editorial-heading">
        <p className="kicker">Connections</p>
        <h1 id="connections-title">From possibility to hello.</h1>
        <p>Nothing leaves Might until you say so.</p>
      </div>

      <motion.div
        className="connection-empty"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
      >
        <ol className="connection-path" aria-label="Connection journey">
          {steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <div className="connection-empty__copy">
          <h2>Your first connection will unfold here.</h2>
          <p>You’ll see what was shared, where the conversation stands, and every next step before Might takes it.</p>
        </div>
      </motion.div>
    </section>
  )
}
