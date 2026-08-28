import { useEffect, useState, type FormEvent } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../../convex/_generated/api'
import { CompanionPresence } from '../components/companion/CompanionPresence'
import { getOrCreateSessionKey } from '../lib/session'

type TalkPhase = 'manifestation' | 'chat'

export function TalkScreen() {
  const [shaping, setShaping] = useState(false)
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<TalkPhase>('manifestation')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isManifesting, setIsManifesting] = useState(false)
  const [manifestationError, setManifestationError] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionKey] = useState(getOrCreateSessionKey)
  const ensureSession = useMutation(api.talk.ensureSession)
  const appendUserMessage = useMutation(api.talk.appendUserMessage)
  const generateManifestation = useAction(api.manifestation.generate)
  const manifestation = useQuery(api.manifestation.current, {
    clientSessionKey: sessionKey,
  })
  const messages = useQuery(api.talk.listMessages, {
    clientSessionKey: sessionKey,
    limit: 50,
  })

  useEffect(() => {
    let active = true

    void ensureSession({ clientSessionKey: sessionKey }).catch(() => {
      if (active) {
        setSessionError('Might could not open your private conversation. Please try again.')
      }
    })

    return () => {
      active = false
    }
  }, [ensureSession, sessionKey])

  async function manifestCompanion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const companionDescription = description.trim()
    if (companionDescription.length < 8 || isManifesting) return

    setIsManifesting(true)
    setManifestationError(null)
    try {
      const result = await generateManifestation({
        clientSessionKey: sessionKey,
        clientRequestId: crypto.randomUUID(),
        description: companionDescription,
      })
      if (result.status === 'failed') {
        setManifestationError(manifestationFailureCopy(result.errorCode))
      }
    } catch {
      setManifestationError(
        'Might could not hold onto that new form. The orb is safe—please try once more.',
      )
    } finally {
      setIsManifesting(false)
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = message.trim()
    if (!content || isSending) return

    setIsSending(true)
    setSessionError(null)
    try {
      await appendUserMessage({ clientSessionKey: sessionKey, content })
      setMessage('')
    } catch {
      setSessionError('That didn’t reach Might. Your words are still here—please try once more.')
    } finally {
      setIsSending(false)
    }
  }

  const activePhase: TalkPhase = messages?.length ? 'chat' : phase
  const isGenerating =
    isManifesting ||
    manifestation?.status === 'generating_brief' ||
    manifestation?.status === 'generating_image'
  const isReady = manifestation?.status === 'ready' && manifestation.imageUrl !== null
  const persistedFailure =
    manifestation?.status === 'failed'
      ? manifestationFailureCopy(manifestation.errorCode)
      : null
  const visibleManifestationError = manifestationError ?? persistedFailure

  if (activePhase === 'chat') {
    return (
      <section className="screen talk-screen talk-screen--chat" aria-labelledby="talk-title">
        <header className="screen-topline">
          <span className="eyebrow">Just talk naturally</span>
          <span className="presence-indicator">
            <i /> Conversation saved in Convex
          </span>
        </header>

        <div className="chat-layout">
          <aside className="chat-companion">
            <CompanionPresence />
            <span>Might</span>
            <p>
              {isReady
                ? 'In the form you imagined.'
                : isGenerating
                  ? 'Taking shape while you talk.'
                  : 'Still in its original form.'}
            </p>
          </aside>

          <div className="chat-column">
            <div className="chat-intro">
              <span className="speaker">Might</span>
              <h1 id="talk-title">Now I’d like to know you.</h1>
              <p>What should I call you?</p>
            </div>

            <div className="message-list" aria-live="polite">
              {messages === undefined ? (
                <p className="message-loading">Opening your private conversation…</p>
              ) : (
                messages.map((item) => (
                  <motion.article
                    className={`message message--${item.role}`}
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span>{item.role === 'user' ? 'You' : 'Might'}</span>
                    <p>{item.content}</p>
                  </motion.article>
                ))
              )}
            </div>

            <form className="chat-composer" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="message">
                Message Might
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell Might something about your day…"
                rows={2}
                maxLength={8000}
              />
              <button type="submit" disabled={!message.trim() || isSending}>
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </form>
            {sessionError ? <p className="inline-error">{sessionError}</p> : null}
            <p className="chat-disclosure">
              This slice stores your words privately in Convex. OpenAI replies and living memory arrive in the next verified slice.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="screen talk-screen" aria-labelledby="talk-title">
      <header className="screen-topline">
        <span className="eyebrow">A quiet beginning</span>
        <span className="presence-indicator">
          <i /> Might is here
        </span>
      </header>

      <div className="talk-hero">
        <div className="talk-hero__visual">
          <CompanionPresence />
          <p className="orb-caption">
            {isReady
              ? 'Your original Might, safely remembered.'
              : isGenerating
                ? 'Your Might is finding an original shape.'
                : 'Your Might, before it takes shape.'}
          </p>
        </div>

        <motion.div
          className="conversation-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16 }}
        >
          <span className="speaker">Might</span>
          <h1 id="talk-title">Hi. I’m Might.</h1>
          <p className="opening-copy">
            Before we get to know each other… would you like me to keep this form,
            or become something you imagine?
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {isReady ? (
              <motion.div
                key="manifestation-ready"
                className="manifestation-result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <span className="manifestation-result__status">Original form created</span>
                <h2>There you are.</h2>
                <p>
                  {manifestation.adaptationNote ??
                    'Might kept the feeling you described and became something entirely its own.'}
                </p>
                <button className="primary-action" type="button" onClick={() => setPhase('chat')}>
                  Start talking <span aria-hidden="true">→</span>
                </button>
              </motion.div>
            ) : isGenerating ? (
              <motion.div
                key="manifestation-progress"
                className="manifestation-progress"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                aria-live="polite"
              >
                <span className="manifestation-progress__pulse" aria-hidden="true" />
                <div>
                  <span className="manifestation-result__status">OpenAI is creating</span>
                  <h2>
                    {manifestation?.status === 'generating_image'
                      ? 'Giving that feeling a face…'
                      : 'Finding an original visual language…'}
                  </h2>
                  <p>This can take a little while. Might will keep its light until the image is safely stored.</p>
                </div>
                <button className="text-action" type="button" onClick={() => setPhase('chat')}>
                  Talk while I wait
                </button>
              </motion.div>
            ) : shaping || manifestation?.status === 'failed' ? (
              <motion.form
                key="shape-form"
                className="shape-form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={manifestCompanion}
              >
                <label htmlFor="companion-description">
                  What would you like me to feel like?
                </label>
                <div className="composer">
                  <input
                    id="companion-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="A tiny night guardian with a soft glow…"
                    autoFocus
                    maxLength={1000}
                  />
                  <button type="submit" disabled={description.trim().length < 8 || isManifesting}>
                    {manifestation?.status === 'failed' ? 'Try again' : 'Manifest with OpenAI'}
                  </button>
                </div>
                {visibleManifestationError ? (
                  <p className="manifestation-error" role="alert">
                    {visibleManifestationError}
                  </p>
                ) : null}
                <button className="text-action" type="button" onClick={() => setPhase('chat')}>
                  Keep the orb instead
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="opening-actions"
                className="opening-actions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <button className="primary-action" type="button" onClick={() => setShaping(true)}>
                  Shape my form <span aria-hidden="true">↗</span>
                </button>
                <button className="secondary-action" type="button" onClick={() => setPhase('chat')}>
                  Keep this form
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="trust-copy">
            Your conversations and memories begin private. You decide what ever leaves Might.
          </p>
          {shaping ? (
            <p className="integration-note">
              Your description is used only to create this companion. The image is stored with your private Convex session.
            </p>
          ) : null}
        </motion.div>
      </div>

      <footer className="talk-footer">
        <span>You have more to offer than you know.</span>
        <span>Might finds where it matters.</span>
      </footer>
    </section>
  )
}

function manifestationFailureCopy(errorCode: string | null): string {
  if (errorCode === 'OPENAI_CONFIGURATION_MISSING') {
    return 'Image generation is not configured on this deployment yet. Might will stay safely in its orb.'
  }
  if (errorCode === 'STORAGE_WRITE_FAILED') {
    return 'The new form arrived, but Might could not save it safely. The orb is still here.'
  }
  return 'That new form could not arrive this time. Might kept its light, and you can try again.'
}
