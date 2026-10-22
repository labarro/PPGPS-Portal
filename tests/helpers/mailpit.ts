/**
 * Leitura de e-mails capturados pelo Mailpit (local/CI). Nada é enviado para fora.
 */
const baseUrl = () => (process.env.MAILPIT_API_URL || 'http://localhost:8025').replace(/\/+$/, '')

type MailpitSummary = { ID: string; Subject: string; To: { Address: string }[]; Created: string }

export async function waitForMessage(
  to: string,
  { timeoutMs = 15_000, subjectIncludes }: { timeoutMs?: number; subjectIncludes?: string } = {},
): Promise<{ subject: string; html: string; text: string }> {
  const deadline = Date.now() + timeoutMs
  const query = encodeURIComponent(`to:"${to}"`)
  while (Date.now() < deadline) {
    const response = await fetch(`${baseUrl()}/api/v1/search?query=${query}&limit=10`)
    if (response.ok) {
      const { messages } = (await response.json()) as { messages: MailpitSummary[] }
      const match = messages.find((message) =>
        subjectIncludes ? message.Subject.includes(subjectIncludes) : true,
      )
      if (match) {
        const full = (await (await fetch(`${baseUrl()}/api/v1/message/${match.ID}`)).json()) as {
          Subject: string
          HTML: string
          Text: string
        }
        return { subject: full.Subject, html: full.HTML, text: full.Text }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(
    `Nenhum e-mail capturado para ${to} em ${timeoutMs} ms (Mailpit em ${baseUrl()}).`,
  )
}

export async function deleteMessagesTo(to: string): Promise<void> {
  const query = encodeURIComponent(`to:"${to}"`)
  await fetch(`${baseUrl()}/api/v1/search?query=${query}`, { method: 'DELETE' }).catch(
    () => undefined,
  )
}

export function extractResetToken(html: string): { url: string; token: string } {
  const match = /href="([^"]*\/admin\/reset\/([^"]+))"/.exec(html)
  if (!match?.[1] || !match[2]) throw new Error('Link de redefinição não encontrado no e-mail.')
  return { url: match[1], token: decodeURIComponent(match[2]) }
}
