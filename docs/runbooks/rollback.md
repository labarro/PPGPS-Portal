# Runbook — Rollback de aplicação

> ADR-0005 (*expand/contract*: a versão anterior do app funciona com o schema novo). Tempo-alvo: **< 5 min**.

## Quando usar

Fumaça falhou, erro em massa no Sentry ou funcionalidade quebrada após um deploy, **sem** perda de dados.

## Aplicação (Vercel)

1. Liste os deploys de produção e identifique o anterior que estava saudável:

   ```bash
   vercel ls ppgps-portal --prod --scope labarros-projects
   ```

2. Reaponte o domínio para ele, sem novo build:

   ```bash
   vercel rollback <url-do-deploy-anterior> --scope labarros-projects
   ```

   Alternativa: no painel da Vercel, **Deployments → ⋯ → Instant Rollback**.
3. Verifique:

   ```bash
   curl -sI https://bioeticaps.app/
   ```

   Rode a fumaça: `bash scripts/ci/smoke-deployment.sh https://bioeticaps.app production`.
4. Enquanto a correção não sai em nova release, mantenha a variável `PRODUCTION_DEPLOY_ENABLED` apagada. Isso impede que um push de tag reimplante a versão com defeito.

## Homologação (ensaio)

Mesmo procedimento com o alias `ppgps-portal-staging.vercel.app`:

```bash
vercel alias set <url-do-deploy-anterior> ppgps-portal-staging.vercel.app --scope labarros-projects
```

Depois reexecute `deploy-staging.yml` para voltar à versão atual. Registre o tempo em `docs/qualidade/relatorio-m1.md`.

## Banco de dados

O rollback de aplicação **não** desfaz migrations: pelo *expand/contract*, isso não é necessário. Se a migration corrompeu dados, siga `restauracao.md`.
