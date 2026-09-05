import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../../convex/_generated/api'
import { CompanionPresence } from '../components/companion/CompanionPresence'
import { getOrCreateSessionKey } from '../lib/session'

type TalkPhase = 'manifestation' | 'chat'

export function TalkScreen() {
  const [shaping, setShaping] = useState(false)
  const [companionNameDraft, setCompanionNameDraft] = useState('')
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<TalkPhase>('manifestation')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isManifesting, setIsManifesting] = useState(false)
  const [manifestationError, setManifestationError] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const pendingMessage = useRef<{ content: string; id: string } | null>(null)
  const [sessionKey] = useState(getOrCreateSessionKey)
  const ensureSession = useMutation(api.talk.ensureSession)
  const appendUserMessage = useMutation(api.talk.appendUserMessage)
  const generateManifestation = useAction(api.manifestation.generate)
  const manifestation = useQuery(api.manifestation.current, {
    clientSessionKey: sessionKey,
  })
  const companionSettings = useQuery(api.companionSettings.current, {
    clientSessionKey: sessionKey,
  })
  const messages = useQuery(api.talk.listMessages, {
    clientSessionKey: sessionKey,
    limit: 50,
  })
  const latestTurn = useQuery(api.talk.latestTurn, {
    clientSessionKey: sessionKey,
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
        name: companionNameDraft.trim() || 'Might',
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
    if (!content || isSending || latestTurn?.status === 'processing') return

    setIsSending(true)
    setSessionError(null)
    try {
      const clientMessageId =
        pendingMessage.current?.content === content
          ? pendingMessage.current.id
          : crypto.randomUUID()
      pendingMessage.current = { content, id: clientMessageId }
      await appendUserMessage({ clientSessionKey: sessionKey, clientMessageId, content })
      pendingMessage.current = null
      setMessage('')
    } catch {
      setSessionError('That didn’t reach Might. Your words are still here—please try once more.')
    } finally {
      setIsSending(false)
    }
  }

  function enterChat() {
    setPhase('chat')
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  const activePhase: TalkPhase = messages?.length ? 'chat' : phase
  const isGenerating =
    isManifesting ||
    manifestation?.status === 'generating_brief' ||
    manifestation?.status === 'generating_image'
  const isReady = manifestation?.status === 'ready' && manifestation.imageUrl !== null
  const companionName = companionSettings?.name ?? manifestation?.name ?? 'Might'
  const persistedFailure =
    manifestation?.status === 'failed'
      ? manifestationFailureCopy(manifestation.errorCode)
      : null
  const visibleManifestationError = manifestationError ?? persistedFailure
  const isThinking = latestTurn?.status === 'processing'
  const turnFailure =
    latestTurn?.status === 'failed'
      ? 'Might could not finish that thought. Your message is safely stored—try telling me one more thing.'
      : null

  if (activePhase === 'chat') {
    return (
      <section
        className="screen talk-screen talk-screen--chat talk-screen--chat-room"
        aria-labelledby="talk-title"
      >
        <div className="talk-room-shell talk-room-shell--chat">
          <div className="talk-room-scene talk-room-scene--chat">
            <div className="talk-room-scene__visuals" aria-hidden="true">
              <img
                className="talk-room-scene__background"
                src="/assets/room/might-room-background-v1.png"
                alt=""
              />
              <img
                className="talk-room-scene__foreground"
                src="/assets/room/might-room-foreground-frame-v3.png"
                alt=""
              />
            </div>

            <header className="screen-topline talk-room-scene__topline talk-room-scene__topline--chat">
              <span className="eyebrow">Just talk naturally</span>
              <span className="presence-indicator">
                <i /> Conversation saved in Convex
              </span>
            </header>

            <div className="chat-layout chat-layout--room">
              <aside className="chat-companion chat-companion--room">
                <CompanionPresence />
                <span>{companionName}</span>
                <p>
                  {isReady
                    ? 'In the form you imagined.'
                    : isGenerating
                      ? 'Taking shape while you talk.'
                      : 'Still in its original form.'}
                </p>
              </aside>

              <div className="chat-column chat-column--room">
                <div className="chat-intro">
                  <span className="speaker">{companionName}</span>
                  <h1 id="talk-title">I’m listening.</h1>
                  <p>What has been on your mind lately?</p>
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
                        <span>{item.role === 'user' ? 'You' : companionName}</span>
                        <p>{item.content}</p>
                      </motion.article>
                    ))
                  )}
                  {isThinking ? (
                    <motion.article
                      className="message message--assistant message--thinking"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      aria-label={`${companionName} is thinking`}
                    >
                      <span>{companionName}</span>
                      <p>
                        <i aria-hidden="true" />
                        <i aria-hidden="true" />
                        <i aria-hidden="true" />
                      </p>
                    </motion.article>
                  ) : null}
                </div>

                <form className="chat-composer" onSubmit={sendMessage}>
                  <label className="sr-only" htmlFor="message">
                    Message {companionName}
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(event) => {
                      if (pendingMessage.current?.content !== event.target.value.trim()) {
                        pendingMessage.current = null
                      }
                      setMessage(event.target.value)
                    }}
                    placeholder={`Tell ${companionName} something about your day…`}
                    rows={2}
                    maxLength={8000}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending || isThinking}
                  >
                    {isSending ? 'Sending…' : isThinking ? 'Thinking…' : 'Send'}
                  </button>
                </form>
                {sessionError || turnFailure ? (
                  <p className="inline-error">{sessionError ?? turnFailure}</p>
                ) : null}
                <p className="chat-disclosure">
                  OpenAI replies through a private Convex Agent thread. Only useful,
                  source-linked memories may appear in Me—and you stay in control of each one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="screen talk-screen talk-screen--room" aria-labelledby="talk-title">
      <div className="talk-room-shell">
        <div className="talk-room-scene">
          <div className="talk-room-scene__visuals">
            <img
              className="talk-room-scene__background"
              src="/assets/room/might-room-background-v1.png"
              alt=""
              aria-hidden="true"
            />

            <header className="screen-topline talk-room-scene__topline">
              <span className="eyebrow">A quiet beginning</span>
              <span className="presence-indicator">
                <i /> Might is here
              </span>
            </header>

            <div className="talk-hero__visual talk-room-scene__companion">
              <CompanionPresence />
              <p className="orb-caption">
                {isReady
                  ? `${companionName}, safely remembered.`
                  : isGenerating
                    ? `${companionName} is finding an original shape.`
                    : 'Your Might, before it takes shape.'}
              </p>
            </div>

            <img
              className="talk-room-scene__foreground"
              src="/assets/room/might-room-foreground-frame-v3.png"
              alt=""
              aria-hidden="true"
            />
          </div>

          <motion.div
            className="conversation-card talk-room-scene__conversation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
          >
            <span className="speaker">{companionName}</span>
            <h1 id="talk-title">Hi. I’m {companionName}.</h1>
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
                  <h2>There you are, {companionName}.</h2>
                  <p>
                    {manifestation.adaptationNote ??
                      'Might kept the feeling you described and became something entirely its own.'}
                  </p>
                  <button
                    className="primary-action room-button room-button--primary"
                    type="button"
                    onClick={enterChat}
                  >
                    Talk with {companionName}
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
                  <button className="text-action" type="button" onClick={enterChat}>
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
                  <div className="shape-form__identity">
                    <label htmlFor="companion-name">What should this Mighty be called?</label>
                    <input
                      id="companion-name"
                      value={companionNameDraft}
                      onChange={(event) => setCompanionNameDraft(event.target.value)}
                      placeholder="Might"
                      maxLength={40}
                      autoComplete="off"
                    />
                  </div>
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
                  <button className="text-action" type="button" onClick={enterChat}>
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
                  <button
                    className="primary-action room-button room-button--primary"
                    type="button"
                    onClick={() => setShaping(true)}
                  >
                    Shape my form
                  </button>
                  <button
                    className="secondary-action room-button room-button--secondary"
                    type="button"
                    onClick={enterChat}
                  >
                    Keep this form
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="trust-copy">
              Your conversations and memories begin private. You decide whatever leaves Might.
            </p>
            {shaping ? (
              <p className="integration-note">
                The name, description, and resulting image stay with this private Convex session. The default remains available if creation pauses.
              </p>
            ) : null}
          </motion.div>
        </div>

        <footer className="talk-footer">
          <span>You have more to offer than you know.</span>
          <span>Might finds where it matters.</span>
        </footer>
      </div>
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
