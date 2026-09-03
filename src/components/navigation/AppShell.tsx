import {
  BookOpen,
  Link2,
  MessageCircle,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useCallback, useEffect, useState, type PropsWithChildren } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { NavLink } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { CompanionPresence } from '../companion/CompanionPresence'
import { SettingsDrawer } from '../settings/SettingsDrawer'
import {
  playMightSoundPreview,
  useAudioPreferences,
} from '../../lib/audioPreferences'
import { getOrCreateSessionKey } from '../../lib/session'

const navigation = [
  { to: '/talk', label: 'Talk', icon: MessageCircle },
  { to: '/me', label: 'Me', icon: BookOpen },
  { to: '/found', label: 'Might Found', icon: Sparkles },
  { to: '/connections', label: 'Connections', icon: Link2 },
] as const

export function AppShell({ children }: PropsWithChildren) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sessionKey] = useState(getOrCreateSessionKey)
  const backendStatus = useQuery(api.talk.status)
  const ensureSession = useMutation(api.talk.ensureSession)
  const {
    soundEffectsEnabled,
    volume,
    setSoundEffectsEnabled,
    setVolume,
  } = useAudioPreferences()

  useEffect(() => {
    void ensureSession({ clientSessionKey: sessionKey }).catch(() => undefined)
  }, [ensureSession, sessionKey])

  const previewSound = useCallback(() => {
    if (soundEffectsEnabled && volume > 0) {
      void playMightSoundPreview(volume)
    }
  }, [soundEffectsEnabled, volume])

  const changeSoundEffects = useCallback(
    (enabled: boolean) => {
      setSoundEffectsEnabled(enabled)
      if (enabled && volume > 0) {
        void playMightSoundPreview(volume)
      }
    },
    [setSoundEffectsEnabled, volume],
  )
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  return (
    <div className="app-shell">
      <div className="ambient ambient--violet" />
      <div className="ambient ambient--apricot" />

      <aside className="side-rail">
        <div className="rail-heading">
          <NavLink className="brand" to="/talk" aria-label="Might home">
            <CompanionPresence compact />
            <span>Might</span>
          </NavLink>
          <button
            className="settings-trigger settings-trigger--top"
            type="button"
            aria-label="Open settings"
            aria-expanded={settingsOpen}
            aria-controls="settings-drawer"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 size={19} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item${isActive ? ' nav-item--active' : ''}`
                }
              >
                <span className="nav-item__icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.55} />
                </span>
                <span className="nav-item__label">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="rail-footer">
          <div className="rail-control-row">
            <button
              className="sound-toggle"
              type="button"
              aria-pressed={!soundEffectsEnabled}
              onClick={() => changeSoundEffects(!soundEffectsEnabled)}
            >
              {soundEffectsEnabled ? (
                <Volume2 size={15} strokeWidth={1.6} aria-hidden="true" />
              ) : (
                <VolumeX size={15} strokeWidth={1.6} aria-hidden="true" />
              )}
              {soundEffectsEnabled ? 'Sound on' : 'Sound off'}
            </button>
            <button
              className="settings-trigger"
              type="button"
              aria-label="Open settings"
              aria-expanded={settingsOpen}
              aria-controls="settings-drawer"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={16} strokeWidth={1.6} aria-hidden="true" />
              <span>Settings</span>
            </button>
          </div>
          <span className="privacy-note">Private by default</span>
          <span className="backend-note">
            <i className={backendStatus?.status === 'live' ? 'is-live' : ''} />
            {backendStatus?.status === 'live' ? 'Convex live' : 'Connecting Convex'}
          </span>
        </div>
      </aside>

      <main className="main-stage">{children}</main>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mobile-nav__item${isActive ? ' mobile-nav__item--active' : ''}`
              }
            >
              <span className="mobile-nav__icon" aria-hidden="true">
                <Icon size={17} strokeWidth={1.55} />
              </span>
              <span>{item.label === 'Might Found' ? 'Found' : item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <SettingsDrawer
        open={settingsOpen}
        onClose={closeSettings}
        sessionKey={sessionKey}
        soundEffectsEnabled={soundEffectsEnabled}
        volume={volume}
        onSoundEffectsChange={changeSoundEffects}
        onVolumeChange={setVolume}
        onPreviewSound={previewSound}
      />
    </div>
  )
}
