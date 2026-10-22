/**
 * Modelos de e-mail em português (S02). HTML simples, sem imagens remotas nem rastreadores,
 * com versão em texto. Todos os valores interpolados são escapados.
 */
export const SITE_NAME = 'Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type PasswordEmailKind = 'reset' | 'setup'

export function resetPasswordUrl(serverUrl: string, token: string): string {
  return `${serverUrl.replace(/\/+$/, '')}/admin/reset/${encodeURIComponent(token)}`
}

export function passwordEmailSubject(kind: PasswordEmailKind): string {
  return kind === 'setup'
    ? 'Defina sua senha de acesso ao portal'
    : 'Redefinição de senha do portal'
}

export function passwordEmailHtml(args: {
  kind: PasswordEmailKind
  name?: string | null
  url: string
  expiresInMinutes: number
}): string {
  const greeting = args.name ? `Olá, ${escapeHtml(args.name)}.` : 'Olá.'
  const intro =
    args.kind === 'setup'
      ? 'Uma conta de acesso à área administrativa do portal foi criada para você. Para começar, defina sua senha pelo link abaixo.'
      : 'Recebemos um pedido para redefinir a senha da sua conta na área administrativa do portal.'
  const url = escapeHtml(args.url)

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#ffffff;color:#0f172a;font-family:Arial,Helvetica,sans-serif;line-height:1.5">
    <p style="margin:0 0 16px;font-weight:bold;color:#0b2545">${escapeHtml(SITE_NAME)}</p>
    <p>${greeting}</p>
    <p>${intro}</p>
    <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#0b2545;color:#ffffff;text-decoration:none;border-radius:6px">${
      args.kind === 'setup' ? 'Definir senha' : 'Redefinir senha'
    }</a></p>
    <p>Ou copie este endereço no navegador:<br><span style="word-break:break-all">${url}</span></p>
    <p>O link vale por ${args.expiresInMinutes} minutos e só pode ser usado uma vez.</p>
    <p>Se você não fez este pedido, ignore esta mensagem: sua senha atual continua válida.</p>
    <p style="color:#475569;font-size:12px">Mensagem automática. Não responda a este e-mail.</p>
  </body>
</html>`
}
