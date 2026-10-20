import 'dotenv/config'

/**
 * Configura o processo para usar o banco de TESTE.
 * - Local: `DATABASE_URL_TEST` (banco `ppgps_test` do docker-compose).
 * - CI: `DATABASE_URL` do serviço Postgres efêmero do job.
 * Recusa bancos Neon: testes automatizados nunca rodam contra ambientes publicados.
 */
export function configureTestDatabase(): string {
  const url = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
  if (!url) {
    throw new Error('Defina DATABASE_URL_TEST (local) ou DATABASE_URL (CI) para os testes.')
  }
  if (/neon\.tech/i.test(url)) {
    throw new Error('Testes automatizados não podem usar bancos Neon.')
  }
  process.env.DATABASE_URL = url
  process.env.PAYLOAD_SECRET ||= 'test-secret-not-used-outside-tests'
  return url
}
