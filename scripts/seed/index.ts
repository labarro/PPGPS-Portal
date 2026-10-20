/**
 * Seed FICTÍCIO e idempotente (AGENTS.md §8.6 e §9.2).
 * Uso: `pnpm seed` (local) ou no job que prepara o branch Neon `seed` (base dos previews).
 *
 * S01: cria apenas uma conta administrativa fictícia (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).
 * Nunca use dados reais de pessoas aqui.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { resolveAppEnv } from '../../src/lib/env/app-env'

async function main(): Promise<void> {
  const env = resolveAppEnv(process.env.APP_ENV)
  if (env === 'production' || env === 'staging') {
    throw new Error(`Seed fictício bloqueado no ambiente "${env}".`)
  }

  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD para executar o seed.')
  }
  if (!email.endsWith('@example.com')) {
    throw new Error('O seed aceita apenas e-mails fictícios do domínio example.com.')
  }

  const payload = await getPayload({ config })

  const existing = await payload.count({ collection: 'users', where: { email: { equals: email } } })
  if (existing.totalDocs > 0) {
    payload.logger.info(`[seed] Usuário fictício ${email} já existe; nada a fazer.`)
  } else {
    await payload.create({ collection: 'users', data: { email, password } })
    payload.logger.info(`[seed] Usuário fictício ${email} criado.`)
  }

  await payload.destroy()
}

// `payload run` encerra o processo assim que o import termina: o await de topo é obrigatório.
// Erros propagam para o `payload run`, que encerra com código 1.
await main()
