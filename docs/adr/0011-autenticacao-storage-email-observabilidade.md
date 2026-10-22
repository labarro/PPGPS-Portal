# ADR-0011 — Autenticação, auditoria, armazenamento (R2), e-mail e observabilidade (S02)

| Campo | Valor |
|---|---|
| Status | Proposto |
| Data | 22/10/2026 |
| Sprint | S02 |
| Autor | Agente |
| Aprovação | — |

## Contexto

A S02 entrega a infraestrutura transversal (ficha `docs/sprints/S02.md`; planejamento 13.3, 14, 16, 17.4–17.7, 24.5). Restrições: orçamento R$ 0; somente dois usuários administrativos (Q5); Vercel Hobby (corpo de requisição limitado a ~4,5 MB por função); R2 configurado pelo supervisor com buckets `ppgps-preview`, `ppgps-staging` e `ppgps-backups`.

## Decisão

1. **Papéis e acesso.** `users.roles` (`admin`, `editor`; `select hasMany`) e `users.active`. Funções puras em `src/access/` (`isAdmin`, `isEditor`, `isAdminOrEditor`, `isAuthenticated`, `adminOrSelf`, `adminEditorOrPublic`); contas desativadas não têm privilégio algum. Só `admin` cria/exclui contas e altera `roles`/`active` (acesso por campo). O editor lê e edita só a própria conta. O primeiro usuário de um banco vazio (bootstrap do Payload) vira `admin`. Não é possível remover o papel, desativar ou excluir o último admin ativo. Contas existentes antes da S02 recebem `admin` pela migration (na S01 toda conta tinha acesso total).
2. **Autenticação.** Senha ≥ 12 caracteres, recusa de senhas comuns/previsíveis/sequenciais/contendo o e-mail (`src/lib/auth/password-policy.ts`), aplicada em criação, edição, primeiro usuário e redefinição. Bloqueio por 15 min após 5 falhas (persistido no banco). Token de redefinição de 1 h, uso único. Sessão: JWT de 2 h com sessões no banco (`useSessions`), renovada pelo painel enquanto há atividade; cookie `HttpOnly`, `SameSite=Lax`, `Secure` fora do local. Links de e-mail usam `SERVER_URL`/`VERCEL_URL`, **nunca** o cabeçalho `Host` (evita envenenamento do link de redefinição).
3. **Limite de taxa.** Janela deslizante em memória por IP (login 10/10 min, recuperação 5/15 min, redefinição 10/15 min), apenas para chamadas REST. **Limitação aceita:** em serverless o contador é por instância; o controle principal continua sendo o bloqueio por conta. Alternativa distribuída (tabela no Postgres ou serviço externo) fica para reavaliação na S06 se houver abuso.
4. **Auditoria.** Coleção `audit-logs` sem create/update/delete pela API (nem para o admin); escrita só pelos hooks transversais na mesma transação da operação (create, update, delete, login, `role_change`, globals). Guarda apenas **nomes** de campos alterados, id/e-mail do autor e IP truncado (/24 ou /48). Sem chave estrangeira para `users`. Um **gatilho no banco** bloqueia UPDATE e TRUNCATE e só permite DELETE de registros com mais de 2 anos (retenção).
5. **Armazenamento.** `@payloadcms/storage-s3` com buckets **privados** (ACL `private`): MinIO no local/CI, R2 em preview (`ppgps-preview`, prefixo `pr-N/` por PR, apagado ao fechar o PR) e homologação (`ppgps-staging`). O bucket de backups é recusado pela aplicação. Arquivos nunca são servidos por URL pública do bucket: todo acesso passa por `/api/<coleção>/file/<nome>`, que executa o `read` da coleção **antes** de ler o objeto (`checkFileAccess` do Payload). Mídia é transmitida pelo app; documentos são entregues por **URL assinada de 5 min** gerada somente após a verificação de acesso. Visitante só vê mídia sem pessoas identificáveis e documentos `public` (`members` é tratado como restrito até existirem contas de integrantes).
6. **Upload seguro.** Hook `beforeOperation` valida o tipo real por magic bytes (JPEG, PNG, WebP, AVIF, PDF), aplica 10 MB (imagem) / 25 MB (PDF), bloqueia SVG/HTML/executáveis/qualquer outro formato e troca o nome por UUID + extensão real. A validação do próprio Payload continua ativa (defesa em profundidade).
7. **E-mail.** Adaptador único (`src/lib/email/`): SMTP (nodemailer) quando configurado; fora da produção, SMTP só é aceito se for de captura (Mailpit local ou caixa de testes declarada com `EMAIL_SMTP_IS_SANDBOX=true`). Sem SMTP fora da produção, as mensagens são **descartadas** e só assunto e destinatário mascarado vão ao log (nunca corpo, link ou token). Produção sem SMTP falha explicitamente. Arquitetura compatível com Resend via SMTP.
8. **Observabilidade e cabeçalhos.** `@sentry/nextjs` só inicializa com DSN (sem DSN o app funciona normalmente); `sendDefaultPii: false`, sem traces/replay; `beforeSend` remove usuário, IP, cookies, cabeçalhos de autenticação, corpo, query string e mascara e-mails/IPs/tokens. CSP completa em `Content-Security-Policy-Report-Only` (com `report-uri` opcional), além de COOP `same-origin` e `X-Permitted-Cross-Domain-Policies: none`.

## Alternativas consideradas

- **Bucket público/`r2.dev` para mídia:** rejeitado — contornaria o controle de acesso (imagens com pessoas identificáveis) e não permite revogação.
- **URL assinada para mídia:** adiado — o `next/image` e o cache do navegador funcionam melhor com URL estável do app; custo de banda na Vercel é baixo no volume previsto.
- **Upload direto do navegador ao R2 (`clientUploads`):** contorna o limite de ~4,5 MB da Vercel, mas exige CORS no bucket e a validação por magic bytes teria de ser refeita após o envio. Fica como pendência (ver Consequências).
- **Rate limit distribuído (Upstash/KV):** custo e dependência extra; não justificado com dois usuários.

## Consequências

- Limite da plataforma: na Vercel Hobby, uploads acima de ~4,5 MB falham antes de chegar ao app (os limites de 10/25 MB valem no local, no CI e em hospedagem própria). Decidir na S06 (hospedagem) entre `clientUploads` com CORS e validação pós-envio, ou outra hospedagem.
- Custos: R2 sem cobrança de saída; faixa gratuita de 10 GB, 1 mi operações classe A e 10 mi classe B por mês. Testes automatizados usam só MinIO; o R2 recebe apenas verificações mínimas por deploy (≈ 7 operações cada). **Faixa gratuita não é garantia de custo zero**: exceder armazenamento/operações gera cobrança no cartão da conta Cloudflare. Monitorar no painel R2 → Metrics.
- Regras de ciclo de vida (expiração de 7 dias em `ppgps-preview`) dependem de configuração manual no painel do R2 (gratuita); a remoção do prefixo ao fechar o PR já é automática.
- O `editor` não acessa o endpoint técnico `/api/users/sentry-test` (somente `admin`).

## Referências

Planejamento v1.3: 13.3, 14.1–14.4, 16, 17.4–17.7, 24.5. ADR-0005, ADR-0009, ADR-0010. Ficha `docs/sprints/S02.md`. `docs/operacao/armazenamento.md`.
