import { motion } from 'motion/react'
import { Orb } from '../components/companion/Orb'

export function MeScreen() {
  return (
    <section className="screen editorial-screen" aria-labelledby="me-title">
      <header className="screen-topline">
        <span className="eyebrow">Living memory</span>
        <Orb compact />
      </header>

      <div className="editorial-heading">
        <p className="kicker">Me</p>
        <h1 id="me-title">What I remember</h1>
        <p>Not a résumé. Just the small truths that may matter someday.</p>
      </div>

      <motion.div
        className="empty-story empty-story--memory"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="memory-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <span className="empty-story__number">00</span>
          <h2>Nothing filed. Nothing assumed.</h2>
          <p>As you talk, meaningful memories will gather here—with their source and your control.</p>
        </div>
      </motion.div>

      <aside className="editorial-note">
        <span>Always yours</span>
        <p>Confirm it, correct it, or ask Might to forget it.</p>
      </aside>
    </section>
  )
}
