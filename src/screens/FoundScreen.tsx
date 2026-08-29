import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { motion } from 'motion/react'
import { api } from '../../convex/_generated/api'
import { CompanionPresence } from '../components/companion/CompanionPresence'
import { getOrCreateSessionKey } from '../lib/session'

export function FoundScreen() {
  const [sessionKey] = useState(getOrCreateSessionKey)
  const [requestError, setRequestError] = useState<string | null>(null)
  const pendingRequestId = useRef<string | null>(null)
  const ensureSession = useMutation(api.talk.ensureSession)
  const requestScan = useMutation(api.worldSignals.requestScan)
  const worldSignal = useQuery(api.worldSignals.latest, {
    clientSessionKey: sessionKey,
  })

  useEffect(() => {
    void ensureSession({ clientSessionKey: sessionKey }).catch(() => {
      setRequestError('Might could not open your private world-sensor session.')
    })
  }, [ensureSession, sessionKey])

  async function listenToWorld() {
    const requestId = pendingRequestId.current ?? crypto.randomUUID()
    pendingRequestId.current = requestId
    setRequestError(null)
    try {
      await requestScan({
        clientSessionKey: sessionKey,
        clientRequestId: requestId,
      })
      pendingRequestId.current = null
    } catch {
      setRequestError('The public source stayed out of reach. Nothing was matched or shared—try once more.')
    }
  }

  const isProcessing = worldSignal?.status === 'processing'
  const isFailed = worldSignal?.status === 'failed'
  const completedSignal = worldSignal?.status === 'completed' ? worldSignal.signal : null
  const firecrawlMode =
    worldSignal?.provenance.sourceMode === 'cached'
      ? 'cached'
      : worldSignal?.provenance.sourceMode === 'live'
        ? 'live'
        : 'verified'

  return (
    <section className="screen editorial-screen" aria-labelledby="found-title">
      <header className="screen-topline">
        <span className="eyebrow">World signals</span>
        <CompanionPresence compact state="thinking" />
      </header>

      <div className="editorial-heading">
        <p className="kicker">Might Found</p>
        <h1 id="found-title">
          {completedSignal ? 'Something real came into view.' : 'Somewhere, something may need you.'}
        </h1>
        <p>Might looks for public situations, not job titles.</p>
      </div>

      {completedSignal ? (
        <motion.article
          className="world-signal-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.62 }}
        >
          <div className="world-signal-card__topline">
            <span>
              {completedSignal.location} · {completedSignal.timeContext}
            </span>
            <div className="world-signal-card__receipts" aria-label="Integration evidence">
              <i>Firecrawl {firecrawlMode}</i>
              <i>OpenAI interpreted</i>
              <i>Convex saved</i>
            </div>
          </div>

          <h2>{completedSignal.situation}</h2>

          <div className="world-signal-card__story">
            <section>
              <span>What I noticed</span>
              <p>{completedSignal.painOrFriction}</p>
            </section>
            <section>
              <span>What may help</span>
              <p>{completedSignal.needHypothesis}</p>
            </section>
          </div>

          <blockquote>
            <span>Public evidence</span>
            <p>“{completedSignal.evidence[0]?.excerpt}”</p>
            <a href={completedSignal.sourceUrl} target="_blank" rel="noreferrer">
              {completedSignal.sourceTitle} <span aria-hidden="true">↗</span>
            </a>
          </blockquote>

          <footer>
            <span>Observed, not matched</span>
            <p>Next, Might will compare this situation with only the relevant private memories—and ask before anything leaves Might.</p>
          </footer>
        </motion.article>
      ) : (
        <motion.div
          className={`empty-story empty-story--found${isProcessing ? ' is-listening' : ''}`}
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
            <span className="empty-story__number">
              {isProcessing ? 'FIRECRAWL IS READING' : isFailed ? 'SIGNAL INTERRUPTED' : 'READY TO LISTEN'}
            </span>
            <h2>
              {isProcessing ? 'Reading one public situation…' : isFailed ? 'The signal faded.' : 'No overlap yet.'}
            </h2>
            <p>
              {isProcessing
                ? 'Might is reading a public Taoyuan community source, then OpenAI will separate evidence from inference.'
                : isFailed
                  ? 'No signal was saved, matched, or shared. A fresh retry is safe.'
                  : 'Let Might inspect one stable public source. It will keep the evidence and stop before matching.'}
            </p>
            <button
              className="world-listen-action"
              type="button"
              onClick={() => void listenToWorld()}
              disabled={isProcessing || worldSignal === undefined}
            >
              {isProcessing ? 'Listening…' : isFailed ? 'Try the public source again' : 'Listen to the public world'}
              {!isProcessing ? <span aria-hidden="true">→</span> : null}
            </button>
            {requestError ? <p className="inline-error" role="alert">{requestError}</p> : null}
          </div>
        </motion.div>
      )}

      <aside className="editorial-note">
        <span>Evidence first</span>
        <p>Every discovery keeps its public source. Observation never authorizes contact.</p>
      </aside>
    </section>
  )
}
