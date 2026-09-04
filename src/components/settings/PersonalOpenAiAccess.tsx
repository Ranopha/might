import {
  Check,
  ExternalLink,
  KeyRound,
  LogOut,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  useAuthActions,
  useAuthToken,
  useConvexAuth,
} from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

type PersonalOpenAiAccessProps = {
  sessionKey: string
}

function readableDate(value: number | null): string | null {
  if (value === null) return null
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function PersonalOpenAiAccess({ sessionKey }: PersonalOpenAiAccessProps) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signIn, signOut } = useAuthActions()
  const authToken = useAuthToken()
  const claimSession = useMutation(api.openAiCredentials.claimSession)
  const removeCredential = useMutation(api.openAiCredentials.remove)
  const credential = useQuery(api.openAiCredentials.current, {
    clientSessionKey: sessionKey,
  })
  const apiKeyRef = useRef<HTMLInputElement>(null)
  const linkAttemptedRef = useRef(false)
  const [accountMode, setAccountMode] = useState<'signIn' | 'signUp'>('signIn')
  const [accountBusy, setAccountBusy] = useState(false)
  const [vaultBusy, setVaultBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      linkAttemptedRef.current = false
      return
    }
    if (
      credential === undefined ||
      !credential.authenticated ||
      credential.roomLinked ||
      credential.roomConflict ||
      linkAttemptedRef.current
    ) {
      return
    }
    linkAttemptedRef.current = true
    void claimSession({ clientSessionKey: sessionKey })
      .catch(() => {
        setError('This private room could not be linked to your account.')
      })
  }, [claimSession, credential, isAuthenticated, sessionKey])

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (accountBusy) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    form.set('flow', accountMode)
    setAccountBusy(true)
    setError(null)
    setMessage(null)
    try {
      await signIn('password', form)
      formElement.reset()
      setMessage(
        accountMode === 'signUp'
          ? 'Your private Might account is ready.'
          : 'Welcome back. Linking this room now.',
      )
    } catch {
      setError(
        accountMode === 'signUp'
          ? 'That account could not be created. Try another email or a longer password.'
          : 'Those account details did not match.',
      )
    } finally {
      setAccountBusy(false)
    }
  }

  async function saveCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = apiKeyRef.current
    const apiKey = input?.value.trim() ?? ''
    if (!apiKey || vaultBusy || authToken === null) return
    setVaultBusy(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/openai/credential', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
        cache: 'no-store',
      })
      const result = (await response.json().catch(() => null)) as
        | { error?: string; lastFour?: string }
        | null
      if (!response.ok) {
        throw new Error(result?.error ?? 'OpenAI could not verify this key.')
      }
      setMessage(`Personal OpenAI key ending ${result?.lastFour ?? '••••'} is active.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The key was not saved.')
    } finally {
      if (input !== null) input.value = ''
      setVaultBusy(false)
    }
  }

  async function removeKey() {
    if (!confirmRemove) {
      setConfirmRemove(true)
      return
    }
    setVaultBusy(true)
    setError(null)
    setMessage(null)
    try {
      await removeCredential({})
      setMessage('The encrypted key was deleted. Hackathon sponsor mode is active again.')
    } catch {
      setError('The key could not be deleted. Please try again.')
    } finally {
      setVaultBusy(false)
      setConfirmRemove(false)
    }
  }

  async function leaveAccount() {
    setError(null)
    setMessage(null)
    await signOut()
  }

  if (isLoading || credential === undefined) {
    return <p className="settings-auth-loading">Opening the private key cabinet…</p>
  }

  if (!isAuthenticated) {
    return (
      <div className="settings-auth-card">
        <div className="settings-api-note">
          <ShieldCheck size={20} strokeWidth={1.5} aria-hidden="true" />
          <p>
            <strong>Sign in before adding a secret.</strong> Guest mode keeps using Might’s
            hackathon OpenAI access. Your own key is never stored in this browser.
          </p>
        </div>
        <div className="settings-auth-tabs" role="tablist" aria-label="Might account">
          <button
            type="button"
            role="tab"
            aria-selected={accountMode === 'signIn'}
            onClick={() => setAccountMode('signIn')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={accountMode === 'signUp'}
            onClick={() => setAccountMode('signUp')}
          >
            Create account
          </button>
        </div>
        <form className="settings-auth-form" onSubmit={submitAccount}>
          <label htmlFor="settings-account-email">Account email</label>
          <input
            id="settings-account-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <label htmlFor="settings-account-password">Password</label>
          <input
            id="settings-account-password"
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete={accountMode === 'signUp' ? 'new-password' : 'current-password'}
            required
          />
          <button className="settings-paper-button" type="submit" disabled={accountBusy}>
            <KeyRound size={15} aria-hidden="true" />
            {accountBusy
              ? 'Opening…'
              : accountMode === 'signUp'
                ? 'Create private account'
                : 'Sign in'}
          </button>
        </form>
        <p className="settings-auth-caveat">
          Use 12+ characters. This hackathon slice does not send email or offer password recovery.
        </p>
        {error ? <p className="settings-error" role="alert">{error}</p> : null}
      </div>
    )
  }

  if (credential?.roomConflict) {
    return (
      <div className="settings-auth-card">
        <p className="settings-error" role="alert">
          This browser room belongs to another Might account. Sign back into that account to use its key.
        </p>
        <button className="settings-text-button" type="button" onClick={() => void leaveAccount()}>
          <LogOut size={14} aria-hidden="true" /> Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="settings-auth-card">
      <div className="settings-account-line">
        <span>
          <strong>{credential?.email ?? 'Private Might account'}</strong>
          <small>{credential?.roomLinked ? 'This room is linked.' : 'Linking this room…'}</small>
        </span>
        <button className="settings-text-button" type="button" onClick={() => void leaveAccount()}>
          <LogOut size={14} aria-hidden="true" /> Sign out
        </button>
      </div>

      {credential?.configured ? (
        <div className="settings-key-status">
          <span className="settings-key-seal"><Check size={16} aria-hidden="true" /></span>
          <span>
            <strong>Personal key · •••• {credential.lastFour}</strong>
            <small>
              Verified for {credential.verifiedModel}
              {readableDate(credential.verifiedAt) ? ` · ${readableDate(credential.verifiedAt)}` : ''}
            </small>
            <small>
              {credential.lastUsedAt
                ? `Last used ${readableDate(credential.lastUsedAt)}`
                : 'Ready for your next OpenAI step.'}
            </small>
          </span>
        </div>
      ) : (
        <div className="settings-control-row settings-control-row--status">
          <KeyRound size={19} aria-hidden="true" />
          <span><strong>OpenAI API</strong><small>Hackathon sponsor mode</small></span>
          <em>Active</em>
        </div>
      )}

      <form className="settings-key-form" onSubmit={saveCredential}>
        <label htmlFor="settings-openai-key">
          {credential?.configured ? 'Replace personal key' : 'Personal OpenAI project key'}
        </label>
        <input
          ref={apiKeyRef}
          id="settings-openai-key"
          name="apiKey"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-…"
          minLength={20}
          maxLength={512}
          disabled={!credential?.roomLinked || vaultBusy}
          required
        />
        <button
          className="settings-paper-button"
          type="submit"
          disabled={!credential?.roomLinked || vaultBusy || authToken === null}
        >
          <ShieldCheck size={15} aria-hidden="true" />
          {vaultBusy ? 'Verifying…' : credential?.configured ? 'Verify & replace' : 'Verify & save'}
        </button>
      </form>

      <p className="settings-auth-caveat">
        Saving makes one tiny OpenAI Responses request on your billing. Might then uses this key only
        for OpenAI work started while you are signed in, with hourly and daily safety limits—not
        Firecrawl, AgentMail, or outreach consent.
      </p>

      <div className="settings-key-actions">
        <a
          className="settings-documentation-link"
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noreferrer"
        >
          Create a dedicated OpenAI key <ExternalLink size={13} aria-hidden="true" />
        </a>
        {credential?.configured ? (
          <button
            className={confirmRemove ? 'settings-danger-button is-confirming' : 'settings-danger-button'}
            type="button"
            disabled={vaultBusy}
            onClick={() => void removeKey()}
            onBlur={() => setConfirmRemove(false)}
          >
            <Trash2 size={14} aria-hidden="true" />
            {confirmRemove ? 'Confirm delete' : 'Delete key'}
          </button>
        ) : null}
      </div>

      {message ? <p className="settings-success" role="status">{message}</p> : null}
      {error ? <p className="settings-error" role="alert">{error}</p> : null}
    </div>
  )
}
