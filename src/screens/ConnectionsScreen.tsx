import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { ArrowRight, Leaf, LockKeyhole } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { CompanionPresence } from '../components/companion/CompanionPresence'
import { SurfaceRoomHero } from '../components/room/SurfaceRoomHero'
import { getOrCreateSessionKey } from '../lib/session'

const steps = ['Noticed', 'Interested', 'You approve', 'Reached out', 'They replied', 'Connected']

function ConnectionJourney({
  completedSteps,
  children,
}: {
  completedSteps: number
  children?: ReactNode
}) {
  const currentStep = Math.max(0, Math.min(steps.length - 1, completedSteps - 1))

  return (
    <section className="connection-accordion" aria-label="Connection journey">
      <div className="connection-accordion__canvas">
        <motion.img
          className="connection-accordion__paper"
          src="/assets/surfaces/connections-accordion-letter-v1.png"
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0, scaleX: 0.94 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
        />
        <ol className="connection-accordion__steps">
          {steps.map((step, index) => {
            const isComplete = index < completedSteps
            const isCurrent = index === currentStep

            return (
              <li
                key={step}
                className={`${isComplete ? 'is-complete' : ''}${isCurrent ? ' is-current' : ''}`.trim() || undefined}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            )
          })}
        </ol>
      </div>
      {children}
    </section>
  )
}

export function ConnectionsScreen() {
  const [sessionKey] = useState(getOrCreateSessionKey)
  const [approvalPending, setApprovalPending] = useState(false)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [sendPending, setSendPending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [connectPending, setConnectPending] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState(false)
  const [recipientDraft, setRecipientDraft] = useState('')
  const [subjectDraft, setSubjectDraft] = useState('')
  const [bodyDraft, setBodyDraft] = useState('')
  const [revisionPending, setRevisionPending] = useState(false)
  const [revisionError, setRevisionError] = useState<string | null>(null)
  const approvalRequestId = useRef<string | null>(null)
  const sendRequestId = useRef<string | null>(null)
  const connectRequestId = useRef<string | null>(null)
  const approveCurrentPitch = useMutation(api.connections.approveCurrentPitch)
  const sendApprovedPitch = useMutation(api.connections.sendApprovedPitch)
  const confirmConnected = useMutation(api.connections.confirmConnected)
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
  const approvedSteps = (() => {
    if (connection === null || connection === undefined) return 0
    if (connection.status === 'connected') return 6
    if (connection.status === 'replied') return 5
    if (connection.status === 'contacted' || connection.status === 'contacting' || connection.status === 'send_failed') return 4
    return hasValidApproval ? 3 : 2
  })()

  function beginEditingDraft() {
    if (!pitch || connection?.mail) return
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

  async function sendExactMessage() {
    if (!connection || !connection.approval?.isValid || connection.mail) return
    const requestId = sendRequestId.current ?? crypto.randomUUID()
    sendRequestId.current = requestId
    setSendPending(true)
    setSendError(null)
    try {
      await sendApprovedPitch({
        clientSessionKey: sessionKey,
        connectionId: connection.id,
        approvalId: connection.approval.id,
        clientRequestId: requestId,
      })
      sendRequestId.current = null
    } catch {
      setSendError('Might could not hand this approved email to AgentMail. No second message was created—please try again.')
    } finally {
      setSendPending(false)
    }
  }

  async function continueConnection() {
    if (!connection || connection.status !== 'replied') return
    const requestId = connectRequestId.current ?? crypto.randomUUID()
    connectRequestId.current = requestId
    setConnectPending(true)
    setConnectError(null)
    try {
      await confirmConnected({
        clientSessionKey: sessionKey,
        connectionId: connection.id,
        clientRequestId: requestId,
      })
      connectRequestId.current = null
    } catch {
      setConnectError('Might could not record that choice yet. The reply is safe—try once more.')
    } finally {
      setConnectPending(false)
    }
  }

  return (
    <section className="screen editorial-screen surface-story-screen" aria-labelledby="connections-title">
      <header className="screen-topline">
        <span className="eyebrow">Human, eventually</span>
        <CompanionPresence compact state={isPreparing ? 'thinking' : 'idle'} />
      </header>

      <SurfaceRoomHero
        variant="connections"
        kicker="Connections · A real hello"
        title={
          connection?.status === 'connected'
            ? 'A possibility became a real hello.'
            : connection?.status === 'replied'
              ? 'They replied.'
              : connection?.status === 'contacted' || connection?.status === 'contacting'
                ? 'Your hello is on its way.'
                : pitch
                  ? 'Before hello, you see everything.'
                  : isPreparing
                    ? 'Might is finding the right words.'
                    : 'From possibility to hello.'
        }
        titleId="connections-title"
        description={
          connection?.status === 'connected'
            ? 'Connected means a two-way conversation has begun—not that any promise or agreement was made.'
            : connection?.status === 'replied'
              ? 'Their words arrived through Might’s inbox and changed this connection live.'
              : pitch
                ? 'A private draft is not permission. You choose what leaves Might—and only after a real recipient is known.'
                : 'Nothing leaves Might until you say so.'
        }
        state={
          connection?.status === 'connected'
            ? 'connected'
            : connection?.status === 'replied'
              ? 'replied'
              : connection
                ? 'active'
                : 'idle'
        }
      />

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
          className="connection-empty connection-empty--accordion"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <ConnectionJourney completedSteps={1}>
            <div className="connection-empty__copy">
              <h2>Your first connection will unfold here.</h2>
              <p>When a match feels right, choose “I’m interested.” Might will prepare a private draft without contacting anyone.</p>
            </div>
            <div className="connection-empty__privacy">
              <LockKeyhole size={15} strokeWidth={1.55} aria-hidden="true" />
              <span>Only you can decide when to share.</span>
            </div>
          </ConnectionJourney>
          <footer className="connection-empty__action-row">
            <Link className="paper-control paper-control--primary connection-unfold-action" to="/found">
              See what Might found
              <Leaf size={16} strokeWidth={1.45} aria-hidden="true" />
            </Link>
          </footer>
        </motion.div>
      ) : (
        <motion.div
          className="connection-story"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <ConnectionJourney completedSteps={Math.max(1, approvedSteps)} />

          <article className="connection-letter">
            <header className="connection-letter__topline">
              <span>
                {isPreparing
                  ? 'Private draft in progress'
                  : pitchFailed
                    ? 'Draft paused safely'
                    : connection.status === 'connected'
                      ? 'Connection opened'
                      : connection.status === 'replied'
                        ? 'A real reply arrived'
                        : connection.status === 'contacted'
                          ? 'Reached out through Might'
                          : connection.status === 'contacting'
                            ? 'AgentMail is delivering'
                            : connection.status === 'send_failed'
                              ? 'Delivery paused safely'
                              : 'Private disclosure preview'}
              </span>
              <i>{connection.sendCount === 0 ? 'Nothing sent' : '1 approved outreach'}</i>
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
                    {!connection.mail ? (
                      <button className="paper-control paper-control--secondary paper-control--small" type="button" onClick={beginEditingDraft}>
                        {pitch.target.email ? 'Change recipient or words' : 'Add recipient and review'}
                      </button>
                    ) : null}
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
                      <button className="paper-control paper-control--secondary" type="button" onClick={() => setEditingDraft(false)} disabled={revisionPending}>
                        Keep previous draft
                      </button>
                      <button className="connection-save-revision paper-control paper-control--primary" type="submit" disabled={revisionPending}>
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
                        <Leaf size={14} strokeWidth={1.45} aria-hidden="true" />
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
                  {connection.mail ? (
                    <div className={`connection-mail-receipt connection-mail-receipt--${connection.mail.status}`}>
                      <strong>
                        {connection.mail.status === 'queued'
                          ? 'AgentMail is sending this exact message.'
                          : connection.mail.status === 'failed'
                            ? 'Delivery stopped safely.'
                            : connection.mail.status === 'replied' || connection.mail.status === 'connected'
                              ? 'This became a two-way thread.'
                              : 'Might reached out.'}
                      </strong>
                      <p>
                        {connection.mail.status === 'queued'
                          ? 'The approved payload is locked. Retries cannot create a second email.'
                          : connection.mail.status === 'failed'
                            ? 'AgentMail did not confirm delivery, and Might will not duplicate the outreach.'
                            : 'AgentMail returned a real thread receipt for this approved outreach.'}
                      </p>
                    </div>
                  ) : hasValidApproval ? (
                    <div className="connection-send-ready">
                      <div className="connection-approval-receipt">
                        <strong>This exact message is approved.</strong>
                        <p>One final action will send only this fingerprint through Might’s inbox.</p>
                      </div>
                      <button
                        className="connection-send-consent paper-control paper-control--primary"
                        type="button"
                        onClick={() => void sendExactMessage()}
                        disabled={sendPending}
                      >
                        {sendPending ? 'Handing it to AgentMail…' : 'Send this exact email'}
                        {!sendPending ? <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /> : null}
                      </button>
                    </div>
                  ) : pitch.canApprove ? (
                    <button
                      className="connection-send-consent paper-control paper-control--primary"
                      type="button"
                      onClick={() => void approveExactMessage()}
                      disabled={approvalPending}
                    >
                      {approvalPending ? 'Recording this approval…' : 'Approve this exact email'}
                      {!approvalPending ? <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /> : null}
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
                {sendError ? <p className="inline-error connection-approval-error" role="alert">{sendError}</p> : null}

                {connection.reply ? (
                  <motion.section
                    className={`connection-reply ${connection.status === 'connected' ? 'is-connected' : ''}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65 }}
                    aria-label="Incoming reply"
                  >
                    <span>{connection.status === 'connected' ? 'Connected' : 'They replied'}</span>
                    <h3>{connection.reply.subject}</h3>
                    <p>“{connection.reply.preview || 'A reply arrived in Might’s inbox.'}”</p>
                    <footer>
                      <small>From {connection.reply.from}</small>
                      {connection.status === 'replied' ? (
                        <button
                          className="paper-control paper-control--primary"
                          type="button"
                          onClick={() => void continueConnection()}
                          disabled={connectPending}
                        >
                          {connectPending ? 'Opening the connection…' : 'Yes, help me continue'}
                          {!connectPending ? <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /> : null}
                        </button>
                      ) : (
                        <strong>Two-way contact is open.</strong>
                      )}
                    </footer>
                    {connectError ? <p className="inline-error" role="alert">{connectError}</p> : null}
                  </motion.section>
                ) : null}
              </>
            ) : null}
          </article>
        </motion.div>
      )}

      <aside className="editorial-note editorial-note--paper">
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
