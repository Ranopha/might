import { useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { motion } from 'motion/react'
import { api } from '../../convex/_generated/api'
import { CompanionPresence } from '../components/companion/CompanionPresence'
import { getOrCreateSessionKey } from '../lib/session'

const steps = ['Noticed', 'Interested', 'You approve', 'Reached out', 'They replied', 'Connected']

export function ConnectionsScreen() {
  const [sessionKey] = useState(getOrCreateSessionKey)
  const [approvalPending, setApprovalPending] = useState(false)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState(false)
  const [recipientDraft, setRecipientDraft] = useState('')
  const [subjectDraft, setSubjectDraft] = useState('')
  const [bodyDraft, setBodyDraft] = useState('')
  const [revisionPending, setRevisionPending] = useState(false)
  const [revisionError, setRevisionError] = useState<string | null>(null)
  const approvalRequestId = useRef<string | null>(null)
  const approveCurrentPitch = useMutation(api.connections.approveCurrentPitch)
  const reviseCurrentPitch = useMutation(api.connections.reviseCurrentPitch)
  const connection = useQuery(api.connections.latest, {
    clientSessionKey: sessionKey,
  })
  const pitch = connection?.pitch ?? null
  const isPreparing = connection?.pitchRun.status === 'processing'
  const pitchFailed = connection?.pitchRun.status === 'failed'
  const hasValidApproval = Boolean(
    connection?.hasValidSendApproval && connection.approval?.isValid,
  )
  const approvedSteps =
    connection === null || connection === undefined ? 0 : hasValidApproval ? 3 : 2

  function beginEditingDraft() {
    if (!pitch) return
    setRecipientDraft(pitch.target.email ?? '')
    setSubjectDraft(pitch.subject)
    setBodyDraft(pitch.body)
    setRevisionError(null)
    setEditingDraft(true)
  }

  async function saveRevisedDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!connection || !pitch) return
    setRevisionPending(true)
    setRevisionError(null)
    try {
      await reviseCurrentPitch({
        clientSessionKey: sessionKey,
        connectionId: connection.id,
        pitchId: pitch.id,
        recipientEmail: recipientDraft.trim(),
        subject: subjectDraft.trim(),
        body: bodyDraft.trim(),
      })
      setEditingDraft(false)
    } catch {
      setRevisionError('Might could not save that exact recipient and message. The previous draft remains unchanged.')
    } finally {
      setRevisionPending(false)
    }
  }

  async function approveExactMessage() {
    if (!connection || !pitch || !pitch.target.email || !pitch.canApprove) return
    const requestId = approvalRequestId.current ?? crypto.randomUUID()
    approvalRequestId.current = requestId
    setApprovalPending(true)
    setApprovalError(null)
    try {
      await approveCurrentPitch({
        clientSessionKey: sessionKey,
        connectionId: connection.id,
        pitchId: pitch.id,
        payloadHash: pitch.payloadHash,
        recipientEmail: pitch.target.email,
        clientRequestId: requestId,
      })
      approvalRequestId.current = null
    } catch {
      setApprovalError('This exact draft could not be approved. Nothing was sent—review it and try again.')
    } finally {
      setApprovalPending(false)
    }
  }

  return (
    <section className="screen editorial-screen" aria-labelledby="connections-title">
      <header className="screen-topline">
        <span className="eyebrow">Human, eventually</span>
        <CompanionPresence compact state={isPreparing ? 'thinking' : 'idle'} />
      </header>

      <div className="editorial-heading">
        <p className="kicker">Connections</p>
        <h1 id="connections-title">
          {pitch
            ? 'Before hello, you see everything.'
            : isPreparing
              ? 'Might is finding the right words.'
              : 'From possibility to hello.'}
        </h1>
        <p>
          {pitch
            ? 'A private draft is not permission. You choose what leaves Might—and only after a real recipient is known.'
            : 'Nothing leaves Might until you say so.'}
        </p>
      </div>

      {connection === undefined ? (
        <motion.div
          className="connection-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-label="Opening your private connection"
        >
          <CompanionPresence state="thinking" />
          <p>Opening your private connection…</p>
        </motion.div>
      ) : connection === null ? (
        <motion.div
          className="connection-empty"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <ol className="connection-path" aria-label="Connection journey">
            {steps.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <div className="connection-empty__copy">
            <h2>Your first connection will unfold here.</h2>
            <p>When a match feels right, choose “I’m interested.” Might will prepare a private draft without contacting anyone.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="connection-story"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <ol className="connection-path connection-path--live" aria-label="Connection journey">
            {steps.map((step, index) => (
              <li key={step} className={index < approvedSteps ? 'is-current' : undefined}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>

          <article className="connection-letter">
            <header className="connection-letter__topline">
              <span>
                {isPreparing
                  ? 'Private draft in progress'
                  : pitchFailed
                    ? 'Draft paused safely'
                    : 'Private disclosure preview'}
              </span>
              <i>{connection.sendCount} emails sent</i>
            </header>

            {isPreparing ? (
              <div className="connection-writing">
                <CompanionPresence compact state="thinking" />
                <div>
                  <h2>Finding a truthful, contextual hello…</h2>
                  <p>OpenAI is drafting from only the memories shown in your match. This still grants no permission to contact anyone.</p>
                </div>
              </div>
            ) : pitchFailed ? (
              <div className="connection-writing connection-writing--failed">
                <CompanionPresence compact />
                <div>
                  <h2>The words did not settle yet.</h2>
                  <p>No draft was saved, no consent was requested, and no email was sent.</p>
                </div>
              </div>
            ) : pitch ? (
              <>
                <div className="connection-recipient">
                  <div>
                    <span>To</span>
                    <strong>{pitch.target.displayName}</strong>
                  </div>
                  <div className="connection-recipient__status">
                    <p>
                      {pitch.target.email ?? 'No verified email yet'}
                      <i className={pitch.target.status === 'configured' ? 'is-ready' : undefined}>
                        {pitch.target.status === 'configured' ? 'Recipient verified' : 'Send locked'}
                      </i>
                    </p>
                    <button type="button" onClick={beginEditingDraft}>
                      {pitch.target.email ? 'Change recipient or words' : 'Add recipient and review'}
                    </button>
                  </div>
                </div>

                {editingDraft ? (
                  <form className="connection-draft-editor" onSubmit={(event) => void saveRevisedDraft(event)}>
                    <header>
                      <span>Revise before consent</span>
                      <p>Saving creates a new fingerprint. Any earlier approval becomes invalid.</p>
                    </header>
                    <label>
                      Recipient email
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={recipientDraft}
                        onChange={(event) => setRecipientDraft(event.target.value)}
                        placeholder="A real recipient you are authorized to contact"
                      />
                    </label>
                    <label>
                      Subject
                      <input
                        type="text"
                        required
                        maxLength={180}
                        value={subjectDraft}
                        onChange={(event) => setSubjectDraft(event.target.value)}
                      />
                    </label>
                    <label>
                      Full message
                      <textarea
                        required
                        maxLength={5000}
                        rows={9}
                        value={bodyDraft}
                        onChange={(event) => setBodyDraft(event.target.value)}
                      />
                    </label>
                    <div>
                      <button type="button" onClick={() => setEditingDraft(false)} disabled={revisionPending}>
                        Keep previous draft
                      </button>
                      <button className="connection-save-revision" type="submit" disabled={revisionPending}>
                        {revisionPending ? 'Saving a new fingerprint…' : 'Save and review exact draft'}
                      </button>
                    </div>
                    {revisionError ? <p className="inline-error" role="alert">{revisionError}</p> : null}
                  </form>
                ) : (
                  <section className="connection-message-preview" aria-label="Full email draft">
                    <span>Subject</span>
                    <h2>{pitch.subject}</h2>
                    <span>Full message</span>
                    <p>{pitch.body}</p>
                  </section>
                )}

                <section className="connection-disclosure" aria-label="Private information in this draft">
                  <header>
                    <div>
                      <span>What would leave Might</span>
                      <h3>Only these private memories</h3>
                    </div>
                    <i>{pitch.privateFields.length} private {pitch.privateFields.length === 1 ? 'field' : 'fields'}</i>
                  </header>
                  <div>
                    {pitch.privateFields.map((field) => (
                      <p key={`${field.memoryId}-${field.statement}`}>
                        <span aria-hidden="true">✦</span>
                        “{field.statement}”
                      </p>
                    ))}
                  </div>
                </section>

                <footer className="connection-consent-gate">
                  <div>
                    <span>Draft fingerprint</span>
                    <code>{pitch.payloadHash}</code>
                  </div>
                  {hasValidApproval ? (
                    <div className="connection-approval-receipt">
                      <strong>This exact message is approved.</strong>
                      <p>Approval is recorded. No email has been sent in this build step.</p>
                    </div>
                  ) : pitch.canApprove ? (
                    <button
                      className="connection-send-consent"
                      type="button"
                      onClick={() => void approveExactMessage()}
                      disabled={approvalPending}
                    >
                      {approvalPending ? 'Recording this approval…' : 'Approve this exact email'}
                      {!approvalPending ? <span aria-hidden="true">→</span> : null}
                    </button>
                  ) : (
                    <div className="connection-send-locked">
                      <strong>Consent is not available yet.</strong>
                      <p>Might needs a verified recipient before it can ask you to approve this exact message.</p>
                    </div>
                  )}
                </footer>
                {connection.approval && !connection.approval.isValid ? (
                  <p className="connection-approval-expired">
                    The earlier approval no longer matches this recipient and message. Review the new fingerprint before approving again.
                  </p>
                ) : null}
                {approvalError ? <p className="inline-error connection-approval-error" role="alert">{approvalError}</p> : null}
              </>
            ) : null}
          </article>
        </motion.div>
      )}

      <aside className="editorial-note">
        <span>{connection ? 'Explicit by design' : 'One step at a time'}</span>
        <p>
          {connection
            ? 'Interest starts a private draft. Approval is a separate, payload-bound decision. Editing the recipient or words invalidates it.'
            : 'Notice is not contact. Interest is not consent. A reply is not a deal.'}
        </p>
      </aside>
    </section>
  )
}
