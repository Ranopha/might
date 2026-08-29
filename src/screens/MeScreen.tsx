import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { CompanionPresence } from '../components/companion/CompanionPresence'
import { getOrCreateSessionKey } from '../lib/session'

export function MeScreen() {
  const [sessionKey] = useState(getOrCreateSessionKey)
  const [editingId, setEditingId] = useState<Id<'memories'> | null>(null)
  const [draft, setDraft] = useState('')
  const [pendingId, setPendingId] = useState<Id<'memories'> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const memories = useQuery(api.memories.list, {
    clientSessionKey: sessionKey,
    limit: 20,
  })
  const confirmMemory = useMutation(api.memories.confirm)
  const editMemory = useMutation(api.memories.edit)
  const forgetMemory = useMutation(api.memories.forget)

  async function confirm(memoryId: Id<'memories'>) {
    setPendingId(memoryId)
    setError(null)
    try {
      await confirmMemory({ clientSessionKey: sessionKey, memoryId })
    } catch {
      setError('Might could not update that memory. Please try again.')
    } finally {
      setPendingId(null)
    }
  }

  async function forget(memoryId: Id<'memories'>) {
    setPendingId(memoryId)
    setError(null)
    try {
      await forgetMemory({ clientSessionKey: sessionKey, memoryId })
    } catch {
      setError('Might could not forget that memory yet. Please try again.')
    } finally {
      setPendingId(null)
    }
  }

  async function saveEdit(
    event: FormEvent<HTMLFormElement>,
    memoryId: Id<'memories'>,
  ) {
    event.preventDefault()
    const statement = draft.trim()
    if (statement.length < 8) return
    setPendingId(memoryId)
    setError(null)
    try {
      await editMemory({ clientSessionKey: sessionKey, memoryId, statement })
      setEditingId(null)
      setDraft('')
    } catch {
      setError('That correction could not be saved. Please try once more.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <section className="screen editorial-screen" aria-labelledby="me-title">
      <header className="screen-topline">
        <span className="eyebrow">Living memory</span>
        <CompanionPresence compact />
      </header>

      <div className="editorial-heading">
        <p className="kicker">Me</p>
        <h1 id="me-title">What I remember</h1>
        <p>Not a résumé. Just the small truths that may matter someday.</p>
      </div>

      {memories === undefined ? (
        <motion.div
          className="empty-story empty-story--memory"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="memory-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <span className="empty-story__number">OPENING</span>
            <h2>Gathering what you’ve shared.</h2>
            <p>Your private living memory is arriving from Convex.</p>
          </div>
        </motion.div>
      ) : memories.length === 0 ? (
        <motion.div
          className="empty-story empty-story--memory"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="memory-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <span className="empty-story__number">00</span>
            <h2>Nothing filed. Nothing assumed.</h2>
            <p>As you talk, meaningful memories will gather here—with their source and your control.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="memory-collection"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="memory-collection__topline">
            <span>{String(memories.length).padStart(2, '0')} living memories</span>
            <span>Private by default</span>
          </div>
          <div className="memory-stack" aria-live="polite">
            <AnimatePresence initial={false}>
              {memories.map((memory, index) => {
                const isEditing = editingId === memory.id
                const isPending = pendingId === memory.id
                return (
                  <motion.article
                    className="memory-card"
                    key={memory.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                  >
                    <div className="memory-card__meta">
                      <span>{memory.semanticType}</span>
                      <span>{memorySourceLabel(memory.source)}</span>
                    </div>
                    {isEditing ? (
                      <form
                        className="memory-edit"
                        onSubmit={(event) => saveEdit(event, memory.id)}
                      >
                        <label className="sr-only" htmlFor={`memory-${memory.id}`}>
                          Correct this memory
                        </label>
                        <textarea
                          id={`memory-${memory.id}`}
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          maxLength={240}
                          rows={3}
                          autoFocus
                        />
                        <div>
                          <button type="submit" disabled={draft.trim().length < 8 || isPending}>
                            Save correction
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setDraft('')
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <h2>{memory.statement}</h2>
                    )}
                    <div className="memory-card__footer">
                      <span>
                        {memory.lastConfirmedAt === null
                          ? 'Waiting for your confirmation'
                          : 'Confirmed by you'}
                      </span>
                      {!isEditing ? (
                        <div className="memory-actions">
                          <button
                            type="button"
                            disabled={isPending || memory.lastConfirmedAt !== null}
                            onClick={() => confirm(memory.id)}
                          >
                            {memory.lastConfirmedAt === null ? 'That’s right' : 'Confirmed'}
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              setEditingId(memory.id)
                              setDraft(memory.statement)
                            }}
                          >
                            Not quite
                          </button>
                          <button
                            className="memory-action--forget"
                            type="button"
                            disabled={isPending}
                            onClick={() => forget(memory.id)}
                          >
                            Forget
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
                )
              })}
            </AnimatePresence>
          </div>
          {error ? <p className="inline-error">{error}</p> : null}
        </motion.div>
      )}

      <aside className="editorial-note">
        <span>Always yours</span>
        <p>Confirm it, correct it, or ask Might to forget it.</p>
      </aside>
    </section>
  )
}

function memorySourceLabel(source: 'conversation' | 'user_edit' | 'system_inference') {
  if (source === 'user_edit') return 'Corrected by you'
  if (source === 'system_inference') return 'Cautious inference · private'
  return 'From what you said · private'
}
