import { expect, type Page, test } from '@playwright/test'

import { strongTestPassword } from '../helpers/test-env'
import {
  cleanupE2EUsers,
  countUsers,
  E2E_EMAIL_DOMAIN,
  loginUser,
  seedLoginUser,
} from '../helpers/users'

const firstUser = {
  email: `primeiro${E2E_EMAIL_DOMAIN}`,
  password: strongTestPassword(),
}

async function expectDashboard(page: Page) {
  await expect(page).toHaveURL(/\/admin\/?$/)
  await expect(page.locator('.dashboard')).toBeVisible()
}

async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/admin/login')
  await page.locator('#field-email').fill(user.email)
  await page.locator('#field-password').fill(user.password)
  await page.locator('button[type="submit"]').click()
  await expectDashboard(page)
}

test.describe.serial('Painel administrativo', () => {
  test.afterAll(async () => {
    await cleanupE2EUsers()
  })

  test('permite criar o primeiro usuário em banco vazio (vira admin)', async ({ page }) => {
    test.skip((await countUsers()) > 0, 'Banco de teste já possui usuários.')

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/create-first-user/)
    await page.locator('#field-email').fill(firstUser.email)
    await page.locator('#field-password').fill(firstUser.password)
    await page.locator('#field-confirm-password').fill(firstUser.password)
    await page.locator('button[type="submit"]').click()
    await expectDashboard(page)
  })

  test('faz login, sai e entra novamente', async ({ page }) => {
    await seedLoginUser()
    await login(page, loginUser)

    // Mesmo destino do botão "sair" do menu lateral.
    await page.goto('/admin/logout')
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 20_000 })
    // Sem sessão, o painel volta a exigir login.
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)

    await login(page, loginUser)
    await page.goto('/admin/collections/users')
    await expect(page.getByText(loginUser.email)).toBeVisible()
  })

  test('admin vê a auditoria com o próprio login registrado', async ({ page }) => {
    await seedLoginUser()
    await login(page, loginUser)
    await page.goto('/admin/collections/audit-logs')
    await expect(page.getByText(loginUser.email).first()).toBeVisible()
  })
})
