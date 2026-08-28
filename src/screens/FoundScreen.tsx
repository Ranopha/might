import { motion } from 'motion/react'
import { Orb } from '../components/companion/Orb'

export function FoundScreen() {
  return (
    <section className="screen editorial-screen" aria-labelledby="found-title">
      <header className="screen-topline">
        <span className="eyebrow">World signals</span>
        <Orb compact state="thinking" />
      </header>

      <div className="editorial-heading">
        <p className="kicker">Might Found</p>
        <h1 id="found-title">Somewhere, something may need you.</h1>
        <p>Might looks for situations, not job titles.</p>
      </div>

      <motion.div
        className="empty-story empty-story--found"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="signal-rings" aria-hidden="true">
          <span />
          <span />
          <i />
        </div>
        <div>
          <span className="empty-story__number">LISTENING</span>
          <h2>No overlap yet.</h2>
          <p>When a real public signal connects with something you’ve shared, Might will show the evidence and explain why it thought of you.</p>
        </div>
      </motion.div>

      <aside className="editorial-note">
        <span>Evidence first</span>
        <p>Every discovery keeps its public source. You can always ask why.</p>
      </aside>
    </section>
  )
}
