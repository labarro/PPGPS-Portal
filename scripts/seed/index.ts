/**
 * Seed FICTÍCIO e idempotente (AGENTS.md §8.6 e §9.2).
 * Uso: `pnpm seed` (local) ou no job que prepara o branch Neon `seed` (base dos previews).
 *
 * Cria apenas uma conta administrativa fictícia (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`)
 * com o papel `admin`. Nunca use dados reais de pessoas aqui.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { checkPassword } from '../../src/lib/auth/password-policy'
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

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  const current = existing.docs[0]
  if (current) {
    // Contas criadas antes da S02 recebem o papel admin pela migration; aqui só garantimos.
    if (!current.roles?.includes('admin') || current.active === false) {
      await payload.update({
        collection: 'users',
        id: current.id,
        data: { roles: ['admin'], active: true },
        context: { skipSetupEmail: true },
      })
      payload.logger.info(`[seed] Usuário fictício ${email} ajustado para admin ativo.`)
    } else {
      payload.logger.info(`[seed] Usuário fictício ${email} já existe; nada a fazer.`)
    }
  } else {
    const check = checkPassword(password, email)
    if (!check.ok) {
      throw new Error(`SEED_ADMIN_PASSWORD não atende à política de senha: ${check.message}`)
    }
    await payload.create({
      collection: 'users',
      data: { email, password, roles: ['admin'], active: true },
      context: { skipSetupEmail: true },
    })
    payload.logger.info(`[seed] Usuário fictício ${email} criado (admin).`)
  }

  await payload.destroy()
}

// `payload run` encerra o processo assim que o import termina: o await de topo é obrigatório.
// Erros propagam para o `payload run`, que encerra com código 1.
await main()
