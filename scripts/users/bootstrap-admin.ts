/**
 * Conta `admin` inicial (S06). Idempotente: só cria se o banco ainda não tiver NENHUMA conta.
 *
 * Uso: `BOOTSTRAP_ADMIN_EMAIL=dev@exemplo.org pnpm users:bootstrap-admin`
 *
 * Em produção, o cadastro do primeiro usuário pelo painel fica fechado (proxy); esta é a única
 * forma de criar a primeira conta. A senha é aleatória e DESCARTADA (nunca impressa nem
 * gravada): o titular define a própria senha em /admin/forgot (e-mail de recuperação, 1 h).
 */
import config from '@payload-config'
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function main(): Promise<void> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase()
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new Error('Defina BOOTSTRAP_ADMIN_EMAIL com um e-mail válido.')
  }

  const payload = await getPayload({ config })
  const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
  if (totalDocs > 0) {
    payload.logger.info(`[bootstrap-admin] ${totalDocs} conta(s) já existe(m); nada a fazer.`)
    await payload.destroy()
    return
  }

  await payload.create({
    collection: 'users',
    data: {
      email,
      name: 'Desenvolvedor responsável',
      roles: ['admin'],
      active: true,
      password: randomBytes(32).toString('base64url'),
    },
    overrideAccess: true,
  })
  payload.logger.info(
    '[bootstrap-admin] Conta admin criada. Defina a senha em /admin/forgot (recuperação de senha).',
  )
  await payload.destroy()
}

// `payload run` encerra o processo assim que o import termina: o await de topo é obrigatório.
await main()
