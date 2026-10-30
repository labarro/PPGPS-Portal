import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { syncMediaConsent, syncPersonConsent } from '@/hooks/consent-sync'

function fakeReq(collections: Record<string, unknown[]>, person: Record<string, unknown> | null) {
  const update = vi.fn(async () => ({}))
  const find = vi.fn(async ({ collection }: { collection: string }) => ({
    docs: collections[collection] ?? [],
  }))
  const findByID = vi.fn(async () => person)
  const req = { payload: { find, findByID, update } } as unknown as PayloadRequest
  return { req, update, find }
}

describe('sincronização de consentimentos', () => {
  it('atualiza os campos calculados da pessoa quando mudam (revogação)', async () => {
    const { req, update } = fakeReq(
      {
        'consent-records': [
          { scopes: ['public_profile'], grantedAt: '2026-10-01', revokedAt: '2026-10-02' },
        ],
      },
      {
        consentPublicProfile: true,
        consentPhoto: false,
        consentEmail: false,
        consentStatus: 'authorized',
      },
    )
    await syncPersonConsent(req, 7)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'people',
        id: 7,
        overrideAccess: true,
        data: {
          consentPublicProfile: false,
          consentPhoto: false,
          consentEmail: false,
          consentStatus: 'revoked',
        },
      }),
    )
  })

  it('não grava quando nada mudou nem quando a pessoa não existe', async () => {
    const same = fakeReq(
      { 'consent-records': [] },
      {
        consentPublicProfile: false,
        consentPhoto: false,
        consentEmail: false,
        consentStatus: 'none',
      },
    )
    await syncPersonConsent(same.req, 1)
    expect(same.update).not.toHaveBeenCalled()
    const missing = fakeReq({ 'consent-records': [] }, null)
    await syncPersonConsent(missing.req, 1)
    expect(missing.update).not.toHaveBeenCalled()
  })

  it('recalcula publicConsent das mídias ligadas e das órfãs', async () => {
    const { req, update, find } = fakeReq(
      {
        media: [
          {
            id: 1,
            publicConsent: true,
            consentRecord: { scopes: ['photo'], grantedAt: '2026-10-01', revokedAt: '2026-10-05' },
          },
          {
            id: 2,
            publicConsent: false,
            consentRecord: { scopes: ['photo'], grantedAt: '2026-10-01' },
          },
          {
            id: 3,
            publicConsent: true,
            consentRecord: { scopes: ['photo'], grantedAt: '2026-10-01' },
          },
          { id: 4, publicConsent: true, consentRecord: null },
        ],
      },
      null,
    )
    await syncMediaConsent(req, 9)
    expect(find.mock.calls[0]?.[0]).toMatchObject({ where: { consentRecord: { equals: 9 } } })
    expect(update).toHaveBeenCalledTimes(3)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, data: { publicConsent: false } }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, data: { publicConsent: true } }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 4, data: { publicConsent: false } }),
    )

    const orphans = fakeReq({ media: [] }, null)
    await syncMediaConsent(orphans.req, null)
    expect(orphans.find.mock.calls[0]?.[0]).toMatchObject({
      where: { and: [{ publicConsent: { equals: true } }, { consentRecord: { exists: false } }] },
    })
  })
})
