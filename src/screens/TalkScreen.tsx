import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../../convex/_generated/api'
import { Orb } from '../components/companion/Orb'
import { getOrCreateSessionKey } from '../lib/session'

type TalkPhase = 'manifestation' | 'chat'

export function TalkScreen() {
  const [shaping, setShaping] = useState(false)
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<TalkPhase>('manifestation')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionKey] = useState(getOrCreateSessionKey)
  const ensureSession = useMutation(api.talk.ensureSession)
  const appendUserMessage = useMutation(api.talk.appendUserMessage)
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
            <Orb />
            <span>Might</span>
            <p>Still in its original form.</p>
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
          <Orb />
          <p className="orb-caption">Your Might, before it takes shape.</p>
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
            {shaping ? (
              <motion.form
                key="shape-form"
                className="shape-form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={(event) => {
                  event.preventDefault()
                  setPhase('chat')
                }}
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
                  />
                  <button type="submit" disabled={description.trim().length < 8}>
                    Continue for now
                  </button>
                </div>
                <button className="text-action" type="button" onClick={() => setShaping(false)}>
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
              Nothing is uploaded or saved until live OpenAI image generation is connected.
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
