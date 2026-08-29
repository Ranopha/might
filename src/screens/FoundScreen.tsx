import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { motion } from 'motion/react'
import { api } from '../../convex/_generated/api'
import { CompanionPresence } from '../components/companion/CompanionPresence'
import { getOrCreateSessionKey } from '../lib/session'

export function FoundScreen() {
  const [sessionKey] = useState(getOrCreateSessionKey)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [clarificationDraft, setClarificationDraft] = useState('')
  const [clarificationError, setClarificationError] = useState<string | null>(null)
  const [dismissPending, setDismissPending] = useState(false)
  const [dismissError, setDismissError] = useState<string | null>(null)
  const pendingRequestId = useRef<string | null>(null)
  const pendingMatchRequestId = useRef<string | null>(null)
  const pendingClarificationRequestId = useRef<string | null>(null)
  const ensureSession = useMutation(api.talk.ensureSession)
  const requestScan = useMutation(api.worldSignals.requestScan)
  const requestMatch = useMutation(api.matches.requestMatch)
  const dismissMatch = useMutation(api.matches.dismiss)
  const submitClarification = useMutation(api.matchClarifications.submitAnswer)
  const worldSignal = useQuery(api.worldSignals.latest, {
    clientSessionKey: sessionKey,
  })
  const matchRun = useQuery(api.matches.latest, {
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

  async function lookForOverlap() {
    if (!completedSignal) return
    const requestId = pendingMatchRequestId.current ?? crypto.randomUUID()
    pendingMatchRequestId.current = requestId
    setMatchError(null)
    try {
      await requestMatch({
        clientSessionKey: sessionKey,
        worldSignalId: completedSignal.id,
        clientRequestId: requestId,
      })
      pendingMatchRequestId.current = null
    } catch {
      setMatchError('Might could not compare this signal yet. Share something useful in Talk, then try again.')
    }
  }

  async function answerClarification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!surfacedMatch || clarificationDraft.trim().length === 0) return
    const requestId = pendingClarificationRequestId.current ?? crypto.randomUUID()
    pendingClarificationRequestId.current = requestId
    setClarificationError(null)
    try {
      await submitClarification({
        clientSessionKey: sessionKey,
        matchId: surfacedMatch.id,
        clientRequestId: requestId,
        answer: clarificationDraft.trim(),
      })
      pendingClarificationRequestId.current = null
    } catch {
      setClarificationError('Might could not save that answer yet. Nothing was shared—please try once more.')
    }
  }

  async function dismissCurrentMatch() {
    if (!surfacedMatch) return
    setDismissPending(true)
    setDismissError(null)
    try {
      await dismissMatch({
        clientSessionKey: sessionKey,
        matchId: surfacedMatch.id,
      })
    } catch {
      setDismissError('Might could not close this match yet. Nothing was shared—please try again.')
    } finally {
      setDismissPending(false)
    }
  }

  const isProcessing = worldSignal?.status === 'processing'
  const isFailed = worldSignal?.status === 'failed'
  const completedSignal = worldSignal?.status === 'completed' ? worldSignal.signal : null
  const matchForSignal =
    completedSignal && matchRun?.worldSignalId === completedSignal.id ? matchRun : null
  const isMatching = matchForSignal?.status === 'processing'
  const matchFailed = matchForSignal?.status === 'failed'
  const completedMatch = matchForSignal?.status === 'completed' ? matchForSignal.match : null
  const matchIsClosed = completedMatch?.status === 'ignored' || completedMatch?.status === 'dismissed'
  const surfacedMatch = completedMatch && !matchIsClosed ? completedMatch : null
  const clarification = surfacedMatch?.clarification ?? null
  const clarificationPending = clarification?.status === 'processing'
  const clarificationFailed = clarification?.status === 'failed'
  const finalMatchResult = clarification?.finalResult ?? null
  const matchWhySituation = finalMatchResult?.whyThisSituationMatters ?? surfacedMatch?.whyThisSituationMatters
  const matchWhyPerson = finalMatchResult?.whyThisPersonCameToMind ?? surfacedMatch?.whyThisPersonCameToMind
  const matchConfidence = finalMatchResult?.matchConfidence ?? surfacedMatch?.matchConfidence ?? 0
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
          {surfacedMatch
            ? 'I found something you might be great for.'
            : completedSignal
              ? 'Something real came into view.'
              : 'Somewhere, something may need you.'}
        </h1>
        <p>
          {surfacedMatch
            ? 'Not a label. A source-backed overlap between one real situation and what you chose to remember.'
            : 'Might looks for public situations, not job titles.'}
        </p>
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

          {surfacedMatch ? (
            <motion.section
              className="match-overlap"
              aria-label="Contextual overlap"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="match-overlap__topline">
                <span>{matchConfidence >= 0.8 ? 'Strong possible fit' : 'Possible fit'}</span>
                <i>OpenAI contextual match</i>
              </div>
              <h3>{matchWhyPerson}</h3>
              <div className="match-overlap__columns">
                <section>
                  <span>Why this situation matters</span>
                  <p>{matchWhySituation}</p>
                </section>
                <section>
                  <span>Why you came to mind</span>
                  <p>{matchWhyPerson}</p>
                </section>
              </div>
              <div className="match-memory-thread">
                <span>Private memory used</span>
                {surfacedMatch.relevantMemories.map((memory) => (
                  <p key={memory.id}>“{memory.statement}”</p>
                ))}
              </div>
            </motion.section>
          ) : null}

          {surfacedMatch ? (
            <motion.section
              className="match-question"
              aria-label="Clarification before consent"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
            >
              <div className="match-question__topline">
                <span>
                  {clarificationPending
                    ? 'Reconsidering with your answer'
                    : finalMatchResult
                      ? 'Your answer strengthened the context'
                      : surfacedMatch.clarificationQuestion
                        ? 'One thing I’m not sure about'
                        : 'Worth exploring'}
                </span>
                <i>No consent requested</i>
              </div>
              <h3>
                {finalMatchResult
                  ? 'This now looks worth exploring with you.'
                  : surfacedMatch.clarificationQuestion ?? 'This may be worth exploring with you.'}
              </h3>
              {clarification ? (
                <blockquote className="match-answer-receipt">
                  <span>Your private answer</span>
                  <p>“{clarification.answer}”</p>
                </blockquote>
              ) : null}
              {surfacedMatch.status === 'needs_clarification' && clarification === null ? (
                <form className="match-answer" onSubmit={(event) => void answerClarification(event)}>
                  <label htmlFor={`clarification-${surfacedMatch.id}`}>Answer inside Might</label>
                  <textarea
                    id={`clarification-${surfacedMatch.id}`}
                    value={clarificationDraft}
                    onChange={(event) => setClarificationDraft(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Share only what would help Might understand this fit…"
                  />
                  <div>
                    <button
                      className="world-match-action"
                      type="submit"
                      disabled={clarificationDraft.trim().length === 0}
                    >
                      Reconsider with this answer <span aria-hidden="true">→</span>
                    </button>
                    <span>Still private · not Send consent</span>
                  </div>
                </form>
              ) : clarificationPending ? (
                <div className="match-thinking" aria-label="OpenAI is reconsidering the match">
                  OpenAI is reconsidering
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <p>
                  {clarificationFailed
                    ? 'The re-check paused safely. Your answer stayed private and nothing was shared.'
                    : finalMatchResult
                      ? 'Your answer stayed inside Might. Exploring this further will still require a separate choice from you.'
                      : 'No memory has been shared. Exploring this further will still require a separate choice from you.'}
                </p>
              )}
              {clarificationError ? <p className="inline-error" role="alert">{clarificationError}</p> : null}
              {surfacedMatch.canContinue ? (
                <div className="match-choice-boundary">
                  <span>Not your path?</span>
                  <button
                    type="button"
                    onClick={() => void dismissCurrentMatch()}
                    disabled={dismissPending || clarificationPending}
                  >
                    {dismissPending ? 'Closing…' : 'Not for me'}
                  </button>
                </div>
              ) : null}
              {dismissError ? <p className="inline-error" role="alert">{dismissError}</p> : null}
            </motion.section>
          ) : null}

          <footer>
            <span>
              {isMatching
                ? 'Looking for context'
                : matchFailed
                  ? 'Match paused safely'
                  : completedMatch?.status === 'ignored'
                    ? 'No convincing overlap'
                    : completedMatch?.status === 'dismissed'
                      ? 'Passed for now'
                    : surfacedMatch
                      ? 'Reasoned, not shared'
                      : 'Observed, not matched'}
            </span>
            {isMatching ? (
              <div className="match-thinking" aria-label="OpenAI is comparing relevant private memories">
                OpenAI is connecting the dots
                <span />
                <span />
                <span />
              </div>
            ) : (
              <p>
                {completedMatch?.status === 'ignored'
                  ? 'Might looked closely and did not find enough evidence to put this in front of you. Nothing was shared.'
                  : completedMatch?.status === 'dismissed'
                    ? 'You closed this possibility. It cannot continue to clarification, consent, or contact.'
                  : surfacedMatch
                    ? 'This is a private suggestion. Consent has not been requested, and Might cannot contact anyone.'
                    : 'Might can compare this situation with only this session’s living memories—and stop before consent.'}
              </p>
            )}
            {!isMatching && !surfacedMatch && !matchIsClosed ? (
              <button
                className="world-match-action"
                type="button"
                onClick={() => void lookForOverlap()}
                disabled={matchRun === undefined}
              >
                {matchFailed ? 'Try the private comparison again' : 'See why Might thought of me'}
                <span aria-hidden="true">→</span>
              </button>
            ) : null}
          </footer>
          {matchError ? <p className="inline-error" role="alert">{matchError}</p> : null}
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
        <span>{surfacedMatch ? 'Still private' : 'Evidence first'}</span>
        <p>
          {surfacedMatch
            ? 'A contextual match is only a thought. Consent and contact are separate steps—and neither has happened.'
            : 'Every discovery keeps its public source. Observation never authorizes contact.'}
        </p>
      </aside>
    </section>
  )
}
