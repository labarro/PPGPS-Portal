# Runbook — Incidente (indisponibilidade, segurança ou dados pessoais)

## 1. Detectar e classificar (até 15 min)

**Sinais de alerta:**

- falha do workflow *Produção — disponibilidade e publicação agendada* (e-mail do GitHub);
- alerta do Sentry;
- relato de usuário.

| Nível | Exemplos | Ação |
|---|---|---|
| Crítico | Dados pessoais expostos; painel invadido; site adulterado | Passos 2–5 imediatamente |
| Alto | Site fora do ar; erro em todas as páginas | Rollback (`rollback.md`) e passo 4 |
| Médio | Uma página/funcionalidade quebrada | Correção em nova release |

## 2. Conter

- **Exposição de dados de uma pessoa:** revogue a autorização no painel (**Consentimentos**, abra o registro e preencha a data de revogação). A revogação retira o perfil, a foto e o e-mail imediatamente. Se o dado estiver num ensaio, arquive o ensaio.
- **Conta comprometida:**
  - desative a conta em **Usuários** (o admin pode fazê-lo);
  - rotacione o `PAYLOAD_SECRET` para encerrar todas as sessões (`rotacao-segredos.md`).
- **Escritas suspeitas:** reimplante com `maintenance=true` (painel somente leitura).
- **Segredo vazado:** rotacione-o (`rotacao-segredos.md`).
- **Site adulterado:** rollback; se o banco foi alterado, `restauracao.md`.

## 3. Investigar

- **Auditoria** (`audit-logs`, só leitura no painel): quem alterou o quê e quando.
- Logs da Vercel (*Runtime Logs*) e eventos do Sentry (sem dados pessoais).
- Operações do Neon e do Cloudflare.

## 4. Comunicar

- O supervisor informa o coordenador do grupo. Agentes **não** contatam terceiros (AGENTS §9.1).
- **Incidente com dados pessoais (LGPD, art. 48):** o grupo avalia, com orientação jurídica, a comunicação aos titulares afetados e à ANPD em prazo razoável. Registre os fatos, os dados afetados, os titulares e as medidas tomadas.

## 5. Encerrar

- Registro em `docs/PROGRESS.md` (sem dados pessoais): cronologia, causa, impacto e correções.
- Teste automatizado que reproduza a falha, quando aplicável.
