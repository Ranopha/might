import { useState, type PropsWithChildren } from 'react'
import { useQuery } from 'convex/react'
import { NavLink } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { CompanionPresence } from '../companion/CompanionPresence'

const navigation = [
  { to: '/talk', label: 'Talk', marker: '◌' },
  { to: '/me', label: 'Me', marker: '◇' },
  { to: '/found', label: 'Might Found', marker: '✦' },
  { to: '/connections', label: 'Connections', marker: '⌁' },
] as const

export function AppShell({ children }: PropsWithChildren) {
  const [muted, setMuted] = useState(false)
  const backendStatus = useQuery(api.talk.status)

  return (
    <div className="app-shell">
      <div className="ambient ambient--violet" />
      <div className="ambient ambient--apricot" />

      <aside className="side-rail">
        <NavLink className="brand" to="/talk" aria-label="Might home">
          <CompanionPresence compact />
          <span>Might</span>
        </NavLink>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item${isActive ? ' nav-item--active' : ''}`
              }
            >
              <span className="nav-item__marker" aria-hidden="true">
                {item.marker}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rail-footer">
          <button
            className="sound-toggle"
            type="button"
            aria-pressed={muted}
            onClick={() => setMuted((value) => !value)}
          >
            <span aria-hidden="true">{muted ? '♪̸' : '♪'}</span>
            {muted ? 'Sound off' : 'Sound on'}
          </button>
          <span className="privacy-note">Private by default</span>
          <span className="backend-note">
            <i className={backendStatus?.status === 'live' ? 'is-live' : ''} />
            {backendStatus?.status === 'live' ? 'Convex live' : 'Connecting Convex'}
          </span>
        </div>
      </aside>

      <main className="main-stage">{children}</main>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `mobile-nav__item${isActive ? ' mobile-nav__item--active' : ''}`
            }
          >
            <span aria-hidden="true">{item.marker}</span>
            <span>{item.label === 'Might Found' ? 'Found' : item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
