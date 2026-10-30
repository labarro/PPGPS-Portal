/**
 * Integrantes FICTÍCIOS para local, E2E e previews (AGENTS.md §8.6 e §9.2). Nunca usar em
 * homologação ou produção: lá só entram pessoas da planilha validada pelo coordenador, com
 * autorização individual registrada (Q4/Q5). Nomes, e-mails (example.com) e identificadores
 * são inventados; ORCIDs no prefixo 0000-0000- (não emitido) e Lattes com zeros à esquerda.
 *
 * Cenários cobertos (roteiro de homologação da S04):
 * - líder autorizada, com e-mail público autorizado;
 * - estudante de mestrado encerrado + pesquisadora ativa (linha do tempo);
 * - ex-integrante autorizado (só no filtro "ex-integrantes");
 * - pessoa SEM autorização (nunca aparece);
 * - autorização revogada (nunca aparece);
 * - colaboradora externa autorizada.
 */
export type SeedConsent = {
  scopes: ('public_profile' | 'photo' | 'email')[]
  grantedAt: string
  revokedAt?: string
}

export type SeedMembership = {
  role:
    | 'leader'
    | 'researcher'
    | 'student'
    | 'technician'
    | 'foreign_collaborator'
    | 'external_collaborator'
  trainingLevel?: 'postdoc' | 'doctorate' | 'masters' | 'specialization' | 'undergraduate' | 'other'
  lines: string[]
  startDate: string
  endDate?: string
  endReason?: 'left' | 'training_completed' | 'role_changed' | 'other'
}

export type SeedPerson = {
  fullName: string
  slug: string
  citationName?: string
  shortBio?: string
  orcid?: string
  lattesUrl?: string
  publicEmail?: string
  expertise?: string[]
  affiliations?: { positionText: string; institutionText: string; programText?: string }[]
  memberships: SeedMembership[]
  consents: SeedConsent[]
  leader?: boolean
}

export const FICTITIOUS_SOURCE = 'Dados fictícios de demonstração (seed:people)'

export const peopleSeed: SeedPerson[] = [
  {
    fullName: 'Helena Exemplar Fictícia',
    slug: 'helena-exemplar-ficticia',
    citationName: 'EXEMPLAR, H. F.',
    shortBio: 'Pessoa fictícia de demonstração: líder do grupo em ambiente de testes.',
    orcid: '0000-0000-0000-001X',
    lattesUrl: 'http://lattes.cnpq.br/0000000000000001',
    publicEmail: 'helena.exemplar@example.com',
    expertise: ['Bioética (fictício)', 'Ética em pesquisa (fictício)'],
    affiliations: [{ positionText: 'Docente (fictício)', institutionText: 'Instituição Exemplo' }],
    memberships: [
      { role: 'leader', lines: ['bioetica', 'promocao-da-saude'], startDate: '2015-03-01' },
    ],
    consents: [{ scopes: ['public_profile', 'email'], grantedAt: '2026-10-01' }],
    leader: true,
  },
  {
    fullName: 'Marina Fictícia Duarte',
    slug: 'marina-ficticia-duarte',
    shortBio: 'Pessoa fictícia: estudante de mestrado do grupo e, depois, pesquisadora.',
    orcid: '0000-0000-0000-0028',
    memberships: [
      {
        role: 'student',
        trainingLevel: 'masters',
        lines: ['bioetica'],
        startDate: '2021-03-01',
        endDate: '2023-02-28',
        endReason: 'training_completed',
      },
      { role: 'researcher', lines: ['bioetica'], startDate: '2023-03-01' },
    ],
    consents: [{ scopes: ['public_profile'], grantedAt: '2026-10-02' }],
  },
  {
    fullName: 'Rafael Demonstração Antigo',
    slug: 'rafael-demonstracao-antigo',
    shortBio: 'Pessoa fictícia: ex-integrante (iniciação científica).',
    memberships: [
      {
        role: 'student',
        trainingLevel: 'undergraduate',
        lines: ['promocao-da-saude'],
        startDate: '2019-03-01',
        endDate: '2021-12-15',
        endReason: 'left',
      },
    ],
    consents: [{ scopes: ['public_profile'], grantedAt: '2026-10-03' }],
  },
  {
    fullName: 'Sofia Ilustrativa Sem Autorização',
    slug: 'sofia-ilustrativa-sem-autorizacao',
    shortBio: 'Pessoa fictícia SEM autorização: nunca deve aparecer no site.',
    memberships: [{ role: 'researcher', lines: ['promocao-da-saude'], startDate: '2022-08-01' }],
    consents: [],
  },
  {
    fullName: 'Tiago Hipotético Revogado',
    slug: 'tiago-hipotetico-revogado',
    shortBio: 'Pessoa fictícia com autorização REVOGADA: nunca deve aparecer no site.',
    memberships: [
      { role: 'student', trainingLevel: 'doctorate', lines: ['bioetica'], startDate: '2024-03-01' },
    ],
    consents: [{ scopes: ['public_profile'], grantedAt: '2026-09-01', revokedAt: '2026-10-10' }],
  },
  {
    fullName: 'Laura Amostra Colaboradora',
    slug: 'laura-amostra-colaboradora',
    shortBio: 'Pessoa fictícia: colaboradora externa nas duas linhas.',
    memberships: [
      {
        role: 'external_collaborator',
        lines: ['bioetica', 'promocao-da-saude'],
        startDate: '2024-06-01',
      },
    ],
    consents: [{ scopes: ['public_profile'], grantedAt: '2026-10-04' }],
  },
]
