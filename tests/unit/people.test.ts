import { describe, expect, it } from 'vitest'

import { CACHE_TAGS, personTag, revalidationPlan } from '@/lib/content/cache-tags'
import { personJsonLd } from '@/lib/content/jsonld'
import { isRedirectCandidate, pathForDocument, personPath } from '@/lib/content/paths'
import { buildSitemap } from '@/lib/content/sitemap'
import { canShowEmail, canShowPhoto, canViewPublic, publicWhere } from '@/lib/content/visibility'
import {
  activeScopes,
  grantsPhoto,
  personConsentFlags,
  validateConsentDates,
} from '@/lib/people/consent'
import {
  authorizedLeaders,
  buildDirectory,
  byCurrentRole,
  filterDirectory,
  filtersToQuery,
  hasActiveFilters,
  initials,
  membersOfLine,
  parseFilters,
  toPublicPhoto,
} from '@/lib/people/directory'
import {
  isValidLattesUrl,
  isValidOrcid,
  normalizeLattesUrl,
  normalizeOrcid,
  orcidCheckDigit,
  orcidSchema,
  zodFieldValidate,
  emailSchema,
  lattesSchema,
} from '@/lib/people/identifiers'
import { parseCsv, parseDate, personKey, validateRows } from '@/lib/people/import-csv'
import {
  currentRole,
  findOverlap,
  isFormerMember,
  membershipLabel,
  membershipPeriod,
  roleFromSlug,
  timeline,
  validateMembership,
} from '@/lib/people/memberships'

describe('ORCID (ISO 7064 mod 11-2)', () => {
  it('calcula o dígito verificador (exemplo oficial 0000-0002-1825-0097)', () => {
    expect(orcidCheckDigit('000000021825009')).toBe('7')
    expect(orcidCheckDigit('000000000000001')).toBe('X')
    expect(isValidOrcid('0000-0002-1825-0097')).toBe(true)
    expect(isValidOrcid('https://orcid.org/0000-0002-1825-0097')).toBe(true)
    expect(isValidOrcid('0000-0000-0000-001X')).toBe(true)
  })

  it('rejeita dígito verificador inválido e formatos errados', () => {
    expect(isValidOrcid('0000-0002-1825-0098')).toBe(false)
    expect(isValidOrcid('0000-0002-1825')).toBe(false)
    expect(isValidOrcid('abcd-0002-1825-0097')).toBe(false)
    expect(zodFieldValidate(orcidSchema, '0000-0002-1825-0098')).toMatch(/dígito verificador/)
    expect(zodFieldValidate(orcidSchema, 'x')).toMatch(/formato/)
    expect(zodFieldValidate(orcidSchema, '')).toBe(true)
    expect(zodFieldValidate(orcidSchema, null)).toBe(true)
  })

  it('normaliza URL, minúsculas e ausência de hífens', () => {
    expect(normalizeOrcid('https://www.orcid.org/0000-0000-0000-001x/')).toBe('0000-0000-0000-001X')
    expect(normalizeOrcid('0000000218250097')).toBe('0000-0002-1825-0097')
    expect(orcidSchema.parse(' https://orcid.org/0000-0002-1825-0097 ')).toBe('0000-0002-1825-0097')
  })
})

describe('Currículo Lattes', () => {
  it('aceita lattes.cnpq.br/<16 dígitos> e buscatextual; normaliza', () => {
    expect(normalizeLattesUrl('https://lattes.cnpq.br/0000000000000001/')).toBe(
      'http://lattes.cnpq.br/0000000000000001',
    )
    expect(
      normalizeLattesUrl(
        'http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=k4000000a1&tipo=x',
      ),
    ).toBe('http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K4000000A1')
    expect(lattesSchema.parse('http://lattes.cnpq.br/0000000000000001')).toBe(
      'http://lattes.cnpq.br/0000000000000001',
    )
  })

  it('rejeita domínios, tamanhos e esquemas inválidos', () => {
    expect(isValidLattesUrl('http://lattes.cnpq.br/123')).toBe(false)
    expect(isValidLattesUrl('https://exemplo.org/0000000000000001')).toBe(false)
    expect(isValidLattesUrl('javascript:alert(1)')).toBe(false)
    expect(zodFieldValidate(lattesSchema, 'http://lattes.cnpq.br/1')).toMatch(/Lattes/)
  })

  it('e-mail', () => {
    expect(emailSchema.parse(' Pessoa@Example.com ')).toBe('pessoa@example.com')
    expect(zodFieldValidate(emailSchema, 'sem-arroba')).toMatch(/E-mail/)
  })
})

const m = (
  role: string,
  startDate: string,
  endDate?: string,
  trainingLevel?: string,
  id = role,
) => ({
  id: `${id}-${startDate}`,
  role,
  trainingLevel: trainingLevel ?? null,
  startDate,
  endDate: endDate ?? null,
})

describe('vínculos', () => {
  const masters = m('student', '2021-03-01', '2023-02-28', 'masters')
  const researcher = m('researcher', '2023-03-01')

  it('papel atual = vínculo ativo de maior hierarquia', () => {
    expect(currentRole([masters, researcher])?.role).toBe('researcher')
    expect(
      currentRole([m('student', '2020-01-01', undefined, 'masters'), m('leader', '2021-01-01')])
        ?.role,
    ).toBe('leader')
    expect(
      currentRole([
        m('student', '2020-01-01', undefined, 'masters', 'a'),
        m('student', '2021-01-01', undefined, 'doctorate', 'b'),
      ])?.trainingLevel,
    ).toBe('doctorate')
    expect(currentRole([masters])).toBeNull()
  })

  it('ex-integrante: tem vínculo e nenhum ativo', () => {
    expect(isFormerMember([masters])).toBe(true)
    expect(isFormerMember([masters, researcher])).toBe(false)
    expect(isFormerMember([])).toBe(false)
  })

  it('linha do tempo: ativos primeiro, depois do mais recente ao mais antigo', () => {
    const old = m('student', '2015-01-01', '2016-01-01', 'undergraduate')
    expect(
      timeline([old, masters, researcher]).map((x) => x.role + (x.trainingLevel ?? '')),
    ).toEqual(['researcher', 'studentmasters', 'studentundergraduate'])
  })

  it('rótulos e períodos', () => {
    expect(membershipLabel(masters)).toBe('Estudante de mestrado')
    expect(membershipLabel(researcher)).toBe('Pesquisador(a)')
    expect(membershipLabel({ role: 'student' })).toBe('Estudante')
    expect(membershipPeriod(masters)).toBe('2021–2023')
    expect(membershipPeriod(researcher)).toBe('2023–atual')
    expect(membershipPeriod(m('leader', '2020-01-01', '2020-06-01'))).toBe('2020')
    expect(roleFromSlug('colaborador-externo')).toBe('external_collaborator')
    expect(roleFromSlug('x')).toBeNull()
  })

  it('não sobreposição do mesmo (papel, nível); fronteiras e papéis distintos permitidos', () => {
    expect(findOverlap(m('student', '2022-01-01', undefined, 'masters', 'n'), [masters])).toBe(
      masters,
    )
    expect(findOverlap(m('student', '2023-02-28', undefined, 'masters', 'n'), [masters])).toBeNull()
    expect(
      findOverlap(m('student', '2022-01-01', undefined, 'doctorate', 'n'), [masters]),
    ).toBeNull()
    expect(
      findOverlap(m('researcher', '2022-01-01', undefined, undefined, 'n'), [masters]),
    ).toBeNull()
    expect(findOverlap({ ...masters }, [masters])).toBeNull()
    expect(
      findOverlap(m('researcher', '2020-01-01', '2024-01-01', undefined, 'n'), [researcher]),
    ).toBe(researcher)
  })

  it('validação isolada do vínculo', () => {
    const today = '2026-10-30'
    expect(validateMembership({ role: 'student', startDate: '2020-01-01' }, today)[0]?.path).toBe(
      'trainingLevel',
    )
    expect(
      validateMembership(
        { role: 'researcher', trainingLevel: 'masters', startDate: '2020-01-01' },
        today,
      )[0]?.path,
    ).toBe('trainingLevel')
    expect(
      validateMembership({ role: 'researcher', startDate: '2027-01-01' }, today)[0]?.path,
    ).toBe('startDate')
    const paths = validateMembership(
      { role: 'researcher', startDate: '2020-01-01', endDate: '2019-01-01' },
      today,
    ).map((e) => e.path)
    expect(paths).toEqual(['endDate', 'endReason'])
    expect(
      validateMembership(
        { role: 'researcher', startDate: '2020-01-01', endDate: '2027-01-01', endReason: 'left' },
        today,
      )[0]?.message,
    ).toMatch(/futuro/)
    expect(
      validateMembership(
        { role: 'researcher', startDate: '2020-01-01', endReason: 'left' },
        today,
      )[0]?.path,
    ).toBe('endReason')
    expect(
      validateMembership(
        { role: 'researcher', startDate: '2020-01-01', endDate: '2021-01-01', endReason: 'left' },
        today,
      ),
    ).toEqual([])
  })
})

describe('consentimentos', () => {
  const grant = (scopes: string[], revokedAt?: string) => ({
    scopes,
    grantedAt: '2026-10-01',
    revokedAt: revokedAt ?? null,
  })

  it('escopos vigentes ignoram revogados', () => {
    expect([
      ...activeScopes([grant(['public_profile', 'photo']), grant(['email'], '2026-10-10')]),
    ]).toEqual(['public_profile', 'photo'])
  })

  it('situação calculada: foto e e-mail exigem perfil público', () => {
    expect(personConsentFlags([])).toEqual({
      consentPublicProfile: false,
      consentPhoto: false,
      consentEmail: false,
      consentStatus: 'none',
    })
    expect(personConsentFlags([grant(['photo', 'email'])])).toMatchObject({
      consentPhoto: false,
      consentEmail: false,
      consentStatus: 'partial',
    })
    expect(personConsentFlags([grant(['public_profile'], '2026-10-02')]).consentStatus).toBe(
      'revoked',
    )
    expect(personConsentFlags([grant(['public_profile']), grant(['photo'])])).toMatchObject({
      consentPublicProfile: true,
      consentPhoto: true,
      consentStatus: 'authorized',
    })
  })

  it('autorização de imagem e datas', () => {
    expect(grantsPhoto(grant(['photo']))).toBe(true)
    expect(grantsPhoto(grant(['photo'], '2026-10-05'))).toBe(false)
    expect(grantsPhoto(grant(['public_profile']))).toBe(false)
    expect(grantsPhoto(null)).toBe(false)
    const today = '2026-10-30'
    expect(validateConsentDates({ grantedAt: '2027-01-01' }, today)[0]?.path).toBe('grantedAt')
    expect(
      validateConsentDates({ grantedAt: '2026-10-10', revokedAt: '2026-10-01' }, today)[0]?.path,
    ).toBe('revokedAt')
    expect(
      validateConsentDates({ grantedAt: '2026-10-10', revokedAt: '2027-10-01' }, today)[0]?.message,
    ).toMatch(/futuro/)
    expect(
      validateConsentDates({ grantedAt: '2026-10-10', revokedAt: '2026-10-20' }, today),
    ).toEqual([])
  })
})

describe('canViewPublic(person) — regra única', () => {
  const base = { visibility: 'public', archivedAt: null, consentPublicProfile: true }

  it('perfil público somente com consentimento, visibilidade pública e sem arquivamento', () => {
    expect(canViewPublic('people', base)).toBe(true)
    expect(canViewPublic('people', { ...base, consentPublicProfile: false })).toBe(false)
    expect(canViewPublic('people', { ...base, visibility: 'admin' })).toBe(false)
    expect(canViewPublic('people', { ...base, archivedAt: '2026-10-01' })).toBe(false)
    expect(canViewPublic('people', null)).toBe(false)
    expect(canViewPublic('memberships', { person: base })).toBe(true)
    expect(canViewPublic('memberships', { person: 12 })).toBe(false)
  })

  it('foto e e-mail exigem os escopos próprios além do perfil', () => {
    expect(canShowPhoto({ ...base, consentPhoto: true })).toBe(true)
    expect(canShowPhoto({ ...base, consentPhoto: false })).toBe(false)
    expect(canShowPhoto({ ...base, consentPublicProfile: false, consentPhoto: true })).toBe(false)
    expect(canShowEmail({ ...base, consentEmail: true })).toBe(true)
    expect(canShowEmail({ ...base })).toBe(false)
  })

  it('filtro de consulta equivale à regra (people e memberships via pessoa)', () => {
    expect(publicWhere('people')).toEqual({
      and: [
        { visibility: { equals: 'public' } },
        { archivedAt: { exists: false } },
        { consentPublicProfile: { equals: true } },
      ],
    })
    expect(publicWhere('memberships')).toEqual({
      and: [
        { 'person.visibility': { equals: 'public' } },
        { 'person.archivedAt': { exists: false } },
        { 'person.consentPublicProfile': { equals: true } },
      ],
    })
  })
})

const LINES = new Map<string, number>([
  ['bioetica', 1],
  ['promocao-da-saude', 2],
])

const people = [
  {
    id: 1,
    slug: 'lider',
    fullName: 'Zélia Líder',
    photo: { url: '/api/media/file/a.png', alt: 'Foto', width: 10, height: 10 },
  },
  { id: 2, slug: 'marina', fullName: 'Marina', shortBio: 'Bio' },
  { id: 3, slug: 'antigo', fullName: 'Ana Antiga' },
  { id: 4, slug: 'sem-vinculo', fullName: 'Bruno' },
]
const memberships = [
  { id: 10, person: 1, role: 'leader', startDate: '2015-01-01', lines: [1, 2] },
  {
    id: 11,
    person: 2,
    role: 'student',
    trainingLevel: 'masters',
    startDate: '2021-03-01',
    endDate: '2023-02-28',
    lines: [1],
  },
  { id: 12, person: { id: 2 }, role: 'researcher', startDate: '2023-03-01', lines: [{ id: 1 }] },
  {
    id: 13,
    person: 3,
    role: 'student',
    trainingLevel: 'undergraduate',
    startDate: '2019-01-01',
    endDate: '2021-01-01',
    lines: [2],
  },
]

describe('diretório de integrantes', () => {
  const directory = buildDirectory(people, memberships)

  it('monta pessoas com vínculos, papel atual e ex-integrante (ordem alfabética)', () => {
    expect(directory.map((p) => p.slug)).toEqual(['antigo', 'sem-vinculo', 'marina', 'lider'])
    const marina = directory.find((p) => p.slug === 'marina')!
    expect(marina.current?.role).toBe('researcher')
    expect(marina.memberships.map((x) => x.role)).toEqual(['researcher', 'student'])
    expect(directory.find((p) => p.slug === 'antigo')!.former).toBe(true)
    expect(directory.find((p) => p.slug === 'lider')!.photo?.url).toBe('/api/media/file/a.png')
  })

  it('padrão: só integrantes atuais; ex-integrantes apenas no filtro próprio', () => {
    const current = filterDirectory(directory, parseFilters({}, ['bioetica']), LINES)
    expect(current.map((p) => p.slug).sort()).toEqual(['lider', 'marina'])
    const former = filterDirectory(
      directory,
      parseFilters({ situacao: 'ex-integrantes' }, []),
      LINES,
    )
    expect(former.map((p) => p.slug)).toEqual(['antigo'])
  })

  it('filtra por papel e linha nos vínculos relevantes', () => {
    const lines = [...LINES.keys()]
    const students = filterDirectory(directory, parseFilters({ papel: 'estudante' }, lines), LINES)
    expect(students).toEqual([])
    const health = filterDirectory(
      directory,
      parseFilters({ linha: 'promocao-da-saude' }, lines),
      LINES,
    )
    expect(health.map((p) => p.slug)).toEqual(['lider'])
    const formerStudents = filterDirectory(
      directory,
      parseFilters(
        { situacao: 'ex-integrantes', papel: 'estudante', linha: 'promocao-da-saude' },
        lines,
      ),
      LINES,
    )
    expect(formerStudents.map((p) => p.slug)).toEqual(['antigo'])
  })

  it('filtros na URL: leitura tolerante e query canônica', () => {
    const filters = parseFilters({ papel: ['lider'], linha: 'inexistente', situacao: 'x' }, [
      'bioetica',
    ])
    expect(filters).toEqual({ role: 'leader', line: null, status: 'atuais' })
    expect(filtersToQuery({ role: 'student', line: 'bioetica', status: 'ex-integrantes' })).toBe(
      '?papel=estudante&linha=bioetica&situacao=ex-integrantes',
    )
    expect(filtersToQuery({ status: 'atuais' })).toBe('')
    expect(hasActiveFilters(filters)).toBe(true)
    expect(hasActiveFilters({ role: null, line: null, status: 'atuais' })).toBe(false)
  })

  it('integrantes da linha, ordem por papel, líderes autorizados e iniciais', () => {
    expect(
      membersOfLine(directory, 1)
        .map((p) => p.slug)
        .sort(),
    ).toEqual(['lider', 'marina'])
    expect([...directory].sort(byCurrentRole)[0]?.slug).toBe('lider')
    expect(authorizedLeaders([1, { id: 2 }, 99], directory).map((p) => p.slug)).toEqual(['lider'])
    expect(authorizedLeaders(null, directory)).toEqual([])
    expect(initials('Marina Fictícia Duarte')).toBe('MD')
    expect(initials('Ana')).toBe('A')
    expect(toPublicPhoto(5)).toBeNull()
    expect(toPublicPhoto({ alt: 'x' })).toBeNull()
  })
})

describe('rotas, cache, sitemap e JSON-LD de pessoas', () => {
  it('caminhos e candidatos a 301', () => {
    expect(personPath('ana')).toBe('/integrantes/ana')
    expect(pathForDocument('people', 'ana')).toBe('/integrantes/ana')
    expect(isRedirectCandidate('/integrantes/ana')).toBe(true)
    expect(isRedirectCandidate('/integrantes')).toBe(false)
  })

  it('revalidação de pessoa cobre diretório, perfil, linhas, /o-grupo, home e sitemap', () => {
    const plan = revalidationPlan('people', { slug: 'nova' }, { slug: 'antiga' })
    expect(plan.tags).toEqual(
      expect.arrayContaining([
        CACHE_TAGS.people,
        CACHE_TAGS.groupProfile,
        CACHE_TAGS.sitemap,
        personTag('nova'),
        personTag('antiga'),
      ]),
    )
    expect(plan.paths).toEqual(
      expect.arrayContaining([
        { path: '/' },
        { path: '/integrantes', type: 'layout' },
        { path: '/o-grupo' },
        { path: '/linhas', type: 'layout' },
        { path: '/integrantes/nova' },
      ]),
    )
  })

  it('sitemap inclui /integrantes e perfis (já filtrados pelo acesso público)', () => {
    const items = buildSitemap(
      {
        profileUpdatedAt: null,
        lines: [],
        pages: [],
        people: [{ slug: 'ana', updatedAt: '2026-10-30' }],
      },
      'https://exemplo.test/',
    )
    expect(items.map((item) => item.url)).toEqual([
      'https://exemplo.test/',
      'https://exemplo.test/integrantes',
      'https://exemplo.test/integrantes/ana',
    ])
    expect(
      buildSitemap({ profileUpdatedAt: null, lines: [], pages: [] }, 'https://x.test'),
    ).toHaveLength(1)
  })

  it('JSON-LD Person com sameAs e sem e-mail', () => {
    const data = personJsonLd(
      {
        fullName: 'Ana',
        slug: 'ana',
        orcid: '0000-0002-1825-0097',
        lattesUrl: 'http://lattes.cnpq.br/0000000000000001',
        otherProfiles: [{ url: 'https://perfil.example/ana' }],
        affiliations: [
          { institutionText: 'Instituição Exemplo', current: true },
          { institutionText: 'Antiga', current: false },
        ],
        expertise: ['Bioética'],
      },
      {
        siteUrl: 'https://exemplo.test',
        path: '/integrantes/ana',
        jobTitle: 'Líder',
        imageUrl: '/api/media/file/a.png',
      },
    )
    expect(data).toMatchObject({
      '@type': 'Person',
      name: 'Ana',
      jobTitle: 'Líder',
      image: 'https://exemplo.test/api/media/file/a.png',
      sameAs: [
        'https://orcid.org/0000-0002-1825-0097',
        'http://lattes.cnpq.br/0000000000000001',
        'https://perfil.example/ana',
      ],
      affiliation: [{ '@type': 'Organization', name: 'Instituição Exemplo' }],
      memberOf: { '@id': 'https://exemplo.test/#grupo' },
    })
    expect(JSON.stringify(data)).not.toMatch(/email/i)
  })
})

describe('importação CSV (parte pura)', () => {
  it('parser RFC 4180 com ; ou , aspas e quebras de linha', () => {
    expect(parseCsv('a;b\r\n"x;1";"di""z"\n\n')).toEqual([
      ['a', 'b'],
      ['x;1', 'di"z'],
    ])
    expect(parseCsv('\uFEFFa,b\n1,"linha\nquebrada"')).toEqual([
      ['a', 'b'],
      ['1', 'linha\nquebrada'],
    ])
  })

  it('datas ISO e brasileiras; inválidas rejeitadas', () => {
    expect(parseDate('2020-02-29')).toBe('2020-02-29')
    expect(parseDate('01/03/2020')).toBe('2020-03-01')
    expect(parseDate('31/02/2020')).toBeNull()
    expect(parseDate('2020/01/01')).toBeNull()
  })

  it('valida cabeçalho e linhas, normaliza aliases e detecta identificador com nomes distintos', () => {
    const header = 'nome_completo;orcid;papel;nivel_formacao;linhas;inicio;termino;motivo_termino'
    expect(validateRows(parseCsv('nome;papel'), { lineSlugs: [] }).headerErrors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/nome_completo/),
        expect.stringMatching(/desconhecidas/),
      ]),
    )
    const csv = [
      header,
      'Ana Exemplo;0000-0002-1825-0097;estudante;mestrado;bioetica;01/03/2020;28/02/2022;conclusao',
      'Ana Exemplo;0000-0002-1825-0097;pesquisador;;bioetica|promocao-da-saude;2022-03-01;;',
      'Outra Ana;0000-0002-1825-0097;tecnico;;;2022-03-01;;',
      'Erro;0000-0002-1825-0098;estudante;;x;2099-01-01;;',
    ].join('\n')
    const { results } = validateRows(parseCsv(csv), {
      lineSlugs: ['bioetica', 'promocao-da-saude'],
      today: '2026-10-30',
    })
    expect(results[0]?.row).toMatchObject({
      role: 'student',
      trainingLevel: 'masters',
      endReason: 'training_completed',
      startDate: '2020-03-01',
      slug: 'ana-exemplo',
      source: 'spreadsheet',
    })
    expect(results[1]?.row?.lines).toEqual(['bioetica', 'promocao-da-saude'])
    expect(results[2]?.row).toBeNull()
    expect(results[2]?.errors.join()).toMatch(/outro nome/)
    expect(results[3]?.errors.join(' | ')).toMatch(/ORCID inválido.*nivel|ORCID inválido/)
    expect(results[3]?.errors.join(' | ')).toMatch(/linha temática desconhecida/)
    expect(personKey(results[0]!.row!)).toBe('orcid:0000-0002-1825-0097')
    expect(personKey({ orcid: null, lattesUrl: null, slug: 'x' })).toBe('slug:x')
  })
})
