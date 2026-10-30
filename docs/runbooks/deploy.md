# Runbook — Deploy de produção

> ADR-0005, ADR-0009, ADR-0016. Executor: desenvolvedor responsável (dono do repositório). Domínio: `https://bioeticaps.app`.

## Pré-requisitos

- `main` verde: CI, verificação de migrations e deploy de homologação.
- Homologação conferida em `https://ppgps-portal-staging.vercel.app`.
- Variável do repositório `PRODUCTION_DEPLOY_ENABLED=true` (*kill switch*: apague-a para impedir qualquer deploy).
- Segredos no ambiente `production`:
  - banco: `DATABASE_URL`, `DATABASE_URL_POOLED`, `PAYLOAD_SECRET`, `NEON_API_KEY`;
  - Vercel: `VERCEL_TOKEN`;
  - arquivos: `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`;
  - e-mail: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`, `SMTP_FROM`;
  - observabilidade e operação: `SENTRY_DSN`, `CRON_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`.
- Release com migration que bloqueie tabelas ou altere dados: ative o modo de manutenção (entrada `maintenance`).

## Passos

1. Na `main` atualizada, crie a tag e publique a release:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z
   ```

   O push da tag dispara `deploy-production.yml`. Para reexecutar uma tag existente (ex.: com manutenção):

   ```bash
   gh workflow run deploy-production.yml --ref vX.Y.Z -f tag=vX.Y.Z -f maintenance=false
   ```

2. Acompanhe os jobs:
   - **Validar release**: trava, tag semântica contida na `main`;
   - **Ponto de restauração**: branch `predeploy-<tag>-<run>`;
   - **Migrations, conteúdo e conta admin**: `migrate`, `migrate:status`, `seed:content` (idempotente) e `users:bootstrap-admin` (só com banco sem contas);
   - **Deploy e fumaça**: R2 real, `vercel deploy --prod` e fumaça no domínio.
3. Confira manualmente:
   - `https://bioeticaps.app/`, `/sobre-o-portal` e `/blog`;
   - os cabeçalhos: `curl -sI https://bioeticaps.app/ | grep -iE 'content-security|x-robots'` (sem `noindex`).
4. Registre em `docs/PROGRESS.md`: tag, execução, resultado da fumaça e ponto de restauração.

## Primeira publicação (somente uma vez)

- A conta `admin` é criada sem senha conhecida: abra `https://bioeticaps.app/admin/forgot`, informe o e-mail de `BOOTSTRAP_ADMIN_EMAIL` e defina a senha pelo link (válido por 1 h).
- Crie a conta `editor` do coordenador em **Usuários**. Ele recebe o e-mail para definir a própria senha.

## Se a fumaça falhar

O deploy já está no domínio. Siga `rollback.md` (*promote* do deploy anterior) e, se a migration for a causa, `restauracao.md`.
