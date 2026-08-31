import {
  Check,
  Circle,
  KeyRound,
  Music2,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { api } from '../../../convex/_generated/api'
import { CompanionPresence } from '../companion/CompanionPresence'

type SettingsDrawerProps = {
  open: boolean
  onClose: () => void
  sessionKey: string
  soundEffectsEnabled: boolean
  volume: number
  onSoundEffectsChange: (enabled: boolean) => void
  onVolumeChange: (volume: number) => void
  onPreviewSound: () => void
}

export function SettingsDrawer({
  open,
  onClose,
  sessionKey,
  soundEffectsEnabled,
  volume,
  onSoundEffectsChange,
  onVolumeChange,
  onPreviewSound,
}: SettingsDrawerProps) {
  const reduceMotion = useReducedMotion()
  const drawerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const settings = useQuery(api.companionSettings.current, {
    clientSessionKey: sessionKey,
  })
  const manifestation = useQuery(api.manifestation.current, {
    clientSessionKey: sessionKey,
  })
  const updateName = useMutation(api.companionSettings.updateName)
  const updateAppearance = useMutation(api.companionSettings.updateAppearance)
  const generateManifestation = useAction(api.manifestation.generate)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [showShapeForm, setShowShapeForm] = useState(false)
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [appearanceStatus, setAppearanceStatus] = useState<'idle' | 'saving'>('idle')
  const [isManifesting, setIsManifesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const closeDrawer = useCallback(() => {
    setNameDraft(null)
    setNameStatus('idle')
    setShowShapeForm(false)
    setDescription('')
    setError(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
      if (event.key === 'Tab' && drawerRef.current !== null) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ),
        )
        const first = focusable.at(0)
        const last = focusable.at(-1)
        if (first === undefined || last === undefined) return
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus()
    }
  }, [closeDrawer, open])

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = (nameDraft ?? settings?.name ?? 'Might').trim()
    if (!name || name.length > 40 || nameStatus === 'saving') return
    setNameStatus('saving')
    setError(null)
    try {
      await updateName({ clientSessionKey: sessionKey, name })
      setNameStatus('saved')
    } catch {
      setNameStatus('idle')
      setError('That name could not be saved to this private room. Please try again.')
    }
  }

  async function chooseAppearance(appearance: 'orb' | 'generated') {
    if (appearanceStatus === 'saving' || settings?.appearance === appearance) return
    setAppearanceStatus('saving')
    setError(null)
    try {
      await updateAppearance({ clientSessionKey: sessionKey, appearance })
    } catch {
      setError('That appearance is not ready to use yet.')
    } finally {
      setAppearanceStatus('idle')
    }
  }

  async function shapeCompanion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = description.trim()
    if (prompt.length < 8 || isManifesting) return
    setIsManifesting(true)
    setError(null)
    try {
      const result = await generateManifestation({
        clientSessionKey: sessionKey,
        clientRequestId: crypto.randomUUID(),
        name: (nameDraft ?? settings?.name ?? 'Might').trim() || 'Might',
        description: prompt,
      })
      if (result.status === 'failed') {
        setError('The new form could not arrive this time. The house orb is still here.')
      } else if (result.status === 'ready') {
        setShowShapeForm(false)
        setDescription('')
      }
    } catch {
      setError('Might could not hold onto that new form. The house orb is still safe.')
    } finally {
      setIsManifesting(false)
    }
  }

  const isGenerating =
    isManifesting ||
    manifestation?.status === 'generating_brief' ||
    manifestation?.status === 'generating_image'
  const currentName = settings?.name ?? 'Might'
  const visibleNameDraft = nameDraft ?? currentName

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="settings-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDrawer()
          }}
        >
          <motion.aside
            ref={drawerRef}
            id="settings-drawer"
            className="settings-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            initial={reduceMotion ? false : { opacity: 0, x: -28, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -22, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              className="settings-drawer__botanical"
              src="/assets/room/might-room-foreground-frame-v3.png"
              alt=""
              aria-hidden="true"
            />
            <header className="settings-drawer__header">
              <div className="settings-drawer__identity">
                <CompanionPresence compact />
                <div>
                  <span className="eyebrow">Your Mighty</span>
                  <h2 id="settings-title">A few things to make yours.</h2>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                className="settings-close"
                type="button"
                onClick={closeDrawer}
                aria-label="Close settings"
              >
                <X size={18} strokeWidth={1.7} aria-hidden="true" />
              </button>
            </header>

            <div className="settings-drawer__scroll">
              <section className="settings-section" aria-labelledby="identity-settings-title">
                <div className="settings-section__heading">
                  <span>01</span>
                  <div>
                    <h3 id="identity-settings-title">Name</h3>
                    <p>The name your companion uses inside this private room.</p>
                  </div>
                </div>
                <form className="settings-name-form" onSubmit={saveName}>
                  <label htmlFor="settings-companion-name">Companion name</label>
                  <div>
                    <input
                      id="settings-companion-name"
                      value={visibleNameDraft}
                      onChange={(event) => {
                        setNameDraft(event.target.value)
                        setNameStatus('idle')
                      }}
                      maxLength={40}
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={
                        nameStatus === 'saving' ||
                        visibleNameDraft.trim().length === 0 ||
                        visibleNameDraft.trim() === currentName
                      }
                    >
                      {nameStatus === 'saving' ? 'Saving…' : nameStatus === 'saved' ? 'Saved' : 'Save'}
                      {nameStatus === 'saved' ? <Check size={14} aria-hidden="true" /> : null}
                    </button>
                  </div>
                </form>
              </section>

              <section className="settings-section" aria-labelledby="appearance-settings-title">
                <div className="settings-section__heading">
                  <span>02</span>
                  <div>
                    <h3 id="appearance-settings-title">Appearance</h3>
                    <p>Return to the house orb whenever you want. Your generated form stays saved.</p>
                  </div>
                </div>
                <div className="appearance-choices" role="group" aria-label="Companion appearance">
                  <button
                    type="button"
                    aria-pressed={settings?.appearance !== 'generated'}
                    className={settings?.appearance !== 'generated' ? 'is-selected' : ''}
                    onClick={() => void chooseAppearance('orb')}
                  >
                    <Circle size={18} strokeWidth={1.45} aria-hidden="true" />
                    <span><strong>House orb</strong><small>The quiet original.</small></span>
                    {settings?.appearance !== 'generated' ? <Check size={15} aria-hidden="true" /> : null}
                  </button>
                  <button
                    type="button"
                    aria-pressed={settings?.appearance === 'generated'}
                    className={settings?.appearance === 'generated' ? 'is-selected' : ''}
                    disabled={!settings?.hasGeneratedAppearance || appearanceStatus === 'saving'}
                    onClick={() => void chooseAppearance('generated')}
                  >
                    <Sparkles size={18} strokeWidth={1.45} aria-hidden="true" />
                    <span><strong>My form</strong><small>{settings?.hasGeneratedAppearance ? 'Made with OpenAI.' : 'Not shaped yet.'}</small></span>
                    {settings?.appearance === 'generated' ? <Check size={15} aria-hidden="true" /> : null}
                  </button>
                </div>

                {!settings?.hasGeneratedAppearance ? (
                  showShapeForm ? (
                    <form className="settings-shape-form" onSubmit={shapeCompanion}>
                      <label htmlFor="settings-shape-description">What should {currentName} feel like?</label>
                      <textarea
                        id="settings-shape-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="A gentle dawn keeper with paper leaves and a warm glow…"
                        rows={3}
                        maxLength={1000}
                      />
                      <div>
                        <button className="settings-text-button" type="button" onClick={() => setShowShapeForm(false)}>
                          Not now
                        </button>
                        <button className="settings-paper-button" type="submit" disabled={description.trim().length < 8 || isGenerating}>
                          <WandSparkles size={15} aria-hidden="true" />
                          {isGenerating ? 'Taking shape…' : 'Create with OpenAI'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button className="settings-inline-action" type="button" onClick={() => setShowShapeForm(true)}>
                      <WandSparkles size={17} strokeWidth={1.5} aria-hidden="true" />
                      <span><strong>Shape an original form</strong><small>One private, Webtoon-style manifestation.</small></span>
                    </button>
                  )
                ) : null}
              </section>

              <section className="settings-section" aria-labelledby="sound-settings-title">
                <div className="settings-section__heading">
                  <span>03</span>
                  <div>
                    <h3 id="sound-settings-title">Sound</h3>
                    <p>Small cues only. Might never starts music on its own.</p>
                  </div>
                </div>
                <div className="settings-control-row">
                  {soundEffectsEnabled ? <Volume2 size={19} aria-hidden="true" /> : <VolumeX size={19} aria-hidden="true" />}
                  <span><strong>Sound effects</strong><small>Discoveries, replies, and gentle confirmations.</small></span>
                  <button
                    className="settings-switch"
                    type="button"
                    role="switch"
                    aria-checked={soundEffectsEnabled}
                    aria-label="Sound effects"
                    onClick={() => onSoundEffectsChange(!soundEffectsEnabled)}
                  ><i /></button>
                </div>
                <div className="settings-volume">
                  <div><span>Volume</span><output>{volume}%</output></div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={volume}
                    disabled={!soundEffectsEnabled}
                    aria-label="Might sound effect volume"
                    onChange={(event) => onVolumeChange(Number(event.target.value))}
                    onPointerUp={onPreviewSound}
                    onKeyUp={(event) => {
                      if (event.key.startsWith('Arrow')) onPreviewSound()
                    }}
                  />
                  <button type="button" disabled={!soundEffectsEnabled || volume === 0} onClick={onPreviewSound}>Hear a preview</button>
                </div>
                <div className="settings-control-row is-disabled">
                  <Music2 size={19} aria-hidden="true" />
                  <span><strong>Background music</strong><small>Waiting for Might’s first soundtrack.</small></span>
                  <button className="settings-switch" type="button" role="switch" aria-checked="false" aria-label="Background music not available yet" disabled><i /></button>
                </div>
              </section>

              <section className="settings-section" aria-labelledby="api-settings-title">
                <div className="settings-section__heading">
                  <span>04</span>
                  <div>
                    <h3 id="api-settings-title">AI access</h3>
                    <p>No API secret is collected by this anonymous browser app.</p>
                  </div>
                </div>
                <div className="settings-control-row settings-control-row--status">
                  <KeyRound size={19} aria-hidden="true" />
                  <span><strong>OpenAI API</strong><small>Hackathon sponsor mode</small></span>
                  <em>Active</em>
                </div>
                <div className="settings-api-note">
                  <ShieldCheck size={20} strokeWidth={1.5} aria-hidden="true" />
                  <p><strong>Your own key comes later, safely.</strong> It needs sign-in and a server-only vault, with rotate and delete controls. Might will never ask you to paste a secret into this drawer.</p>
                </div>
                <a className="settings-documentation-link" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Open the official OpenAI key page</a>
              </section>

              {error ? <p className="settings-error" role="alert">{error}</p> : null}
              <p className="settings-private-note"><ShieldCheck size={14} aria-hidden="true" /> Names and appearance stay inside this browser’s private Convex session. Audio preferences stay only on this device.</p>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
