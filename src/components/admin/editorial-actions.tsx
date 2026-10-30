'use client'

import { useAuth, useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { useEffect, useId, useState } from 'react'

import {
  actionLabel,
  availableTransitions,
  MIN_COMMENT_LENGTH,
  stateOf,
  WORKFLOW_LABELS,
  type WorkflowState,
} from '@/lib/editorial/workflow'

/**
 * Ações do fluxo editorial no painel (ficha S05). Mostra a situação atual e somente as
 * transições permitidas pela máquina de estados; cada ação chama
 * `POST /api/essays/:id/transition`, que revalida tudo no servidor (papel, transição,
 * comentário obrigatório na devolução, checklist, data do agendamento).
 */
type EssayState = {
  workflowStatus?: string
  scheduledAt?: string | null
  publishedAt?: string | null
  archivedAt?: string | null
  submittedBy?: number | { id: number } | null
  reviewHistory?: { to?: string; comment?: string | null; actorName?: string; at?: string }[]
}

type ApiError = { message?: string; details?: string[] }

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const buttonStyle = (primary: boolean): React.CSSProperties => ({
  minHeight: 36,
  padding: '6px 12px',
  borderRadius: 4,
  border: primary ? '1px solid var(--theme-elevation-900)' : '1px solid var(--theme-elevation-400)',
  background: primary ? 'var(--theme-elevation-900)' : 'var(--theme-elevation-0)',
  color: primary ? 'var(--theme-elevation-0)' : 'var(--theme-elevation-900)',
  cursor: 'pointer',
  textAlign: 'left',
  font: 'inherit',
})

const formatDateTime = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
      )
    : null

const relId = (value: EssayState['submittedBy']) =>
  value && typeof value === 'object' ? value.id : (value ?? null)

export function EditorialActions() {
  const { id, collectionSlug } = useDocumentInfo()
  const { user } = useAuth()
  const modified = useFormModified()
  const [state, setState] = useState<EssayState | null>(null)
  const [comment, setComment] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const commentId = useId()
  const scheduleId = useId()
  const errorId = useId()

  useEffect(() => {
    if (!id || collectionSlug !== 'essays') return
    let active = true
    const controller = new AbortController()
    // Conclui agendamentos vencidos antes de exibir a situação (hospedagem sem processo contínuo).
    fetch('/api/essays/publish-due', {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    })
      .catch(() => null)
      .then(() =>
        fetch(`/api/essays/${id}?draft=true&depth=0`, {
          credentials: 'include',
          signal: controller.signal,
        }),
      )
      .then(async (response) => {
        if (active && response.ok) setState((await response.json()) as EssayState)
      })
      .catch(() => null)
    return () => {
      active = false
      controller.abort()
    }
  }, [id, collectionSlug])

  if (!id) {
    return (
      <div style={box}>
        <strong>Ações editoriais</strong>
        <p style={{ margin: 0 }}>Salve o rascunho para habilitar o envio à revisão.</p>
      </div>
    )
  }

  const current = stateOf(state?.workflowStatus)
  const options = state ? availableTransitions(current) : []
  const lastComment = [...(state?.reviewHistory ?? [])].reverse().find((entry) => entry.comment)
  const submittedByMe = user && relId(state?.submittedBy) === user.id

  async function run(to: WorkflowState) {
    setError(null)
    if (modified) {
      setError({ message: 'Há alterações não salvas. Salve o rascunho antes de mudar a situação.' })
      return
    }
    if (to === 'returned' && comment.trim().length < MIN_COMMENT_LENGTH) {
      setError({
        message: `Escreva o comentário de revisão (mínimo de ${MIN_COMMENT_LENGTH} caracteres) para devolver.`,
      })
      return
    }
    if (to === 'scheduled' && !scheduledAt) {
      setError({ message: 'Informe a data e a hora da publicação agendada.' })
      return
    }
    setBusy(true)
    try {
      const response = await fetch(`/api/essays/${id}/transition`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          comment: comment.trim() || null,
          scheduledAt: to === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
        }),
      })
      if (!response.ok) {
        setError((await response.json().catch(() => ({}))) as ApiError)
        return
      }
      // Recarrega o documento inteiro (formulário, versões e campos somente leitura).
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={box} aria-labelledby={`${commentId}-titulo`}>
      <strong id={`${commentId}-titulo`}>Ações editoriais</strong>
      <p style={{ margin: 0 }} data-testid="editorial-status">
        Situação: <strong>{WORKFLOW_LABELS[current]}</strong>
        {current === 'scheduled' && state?.scheduledAt
          ? ` — publicação em ${formatDateTime(state.scheduledAt)}`
          : null}
      </p>
      {lastComment && (current === 'returned' || current === 'in_review') ? (
        <div style={{ fontSize: 13 }}>
          <strong>Último comentário de revisão</strong>
          {lastComment.actorName ? ` (${lastComment.actorName})` : null}:
          <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{lastComment.comment}</p>
        </div>
      ) : null}
      {current === 'in_review' && submittedByMe ? (
        <p style={{ margin: 0, fontSize: 13 }}>
          Sugestão: a aprovação deve ser feita, quando possível, por quem não redigiu ou enviou o
          texto.
        </p>
      ) : null}
      {options.length > 0 ? (
        <>
          <label htmlFor={commentId} style={{ fontSize: 13 }}>
            Comentário de revisão (obrigatório para devolver)
          </label>
          <textarea
            id={commentId}
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            style={{ width: '100%', font: 'inherit', padding: 6 }}
          />
          {options.includes('scheduled') ? (
            <>
              <label htmlFor={scheduleId} style={{ fontSize: 13 }}>
                Data e hora da publicação agendada
              </label>
              <input
                id={scheduleId}
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                style={{ font: 'inherit', padding: 6 }}
              />
            </>
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {options.map((to) => (
              <button
                key={to}
                type="button"
                disabled={busy}
                aria-describedby={error ? errorId : undefined}
                onClick={() => void run(to)}
                style={buttonStyle(to === 'approved' || to === 'published' || to === 'in_review')}
              >
                {actionLabel(current, to)}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {error ? (
        <div id={errorId} role="alert" style={{ color: 'var(--theme-error-500, #b00020)' }}>
          <p style={{ margin: 0 }}>{error.message ?? 'Não foi possível concluir a ação.'}</p>
          {error.details && error.details.length > 0 ? (
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {error.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

/** Substitui o botão "Publicar" genérico: ensaios só são publicados pelas ações editoriais. */
export function PublishViaWorkflow() {
  return null
}
