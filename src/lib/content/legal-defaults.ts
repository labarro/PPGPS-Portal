import type { LegalPageSlug } from './paths'

/**
 * Texto padrão das páginas legais (S06, RF-021). Fonte única: renderizado pela rota quando não
 * há página publicada no CMS e usado pelo `seed:content` para criar a página editável.
 *
 * Regras (AGENTS.md §9.1): nenhum dado institucional inventado. O controlador e o canal formal
 * do titular seguem em aberto (Q4): o texto identifica o grupo como mantenedor (Q1) e orienta
 * os pedidos para a página de contato do grupo, sem nomear pessoas nem e-mails.
 */
export type LegalLink = { label: string; href: string }

export type LegalParagraph = string | { before: string; link: LegalLink; after?: string }

export type LegalSection = {
  heading: string
  paragraphs?: LegalParagraph[]
  items?: string[]
}

export type LegalDocument = {
  title: string
  summary: string
  sections: LegalSection[]
}

export const LEGAL_REVIEWED_AT = '30/10/2026'

const CONTACT: LegalLink = { label: 'Contato', href: '/o-grupo/contato' }

export const LEGAL_DEFAULTS: Record<LegalPageSlug, LegalDocument> = {
  privacidade: {
    title: 'Política de privacidade',
    summary:
      'Como este portal trata dados pessoais e como exercer os direitos de titular previstos na Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).',
    sections: [
      {
        heading: 'Quem mantém o portal',
        paragraphs: [
          'Este portal é mantido pelo Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar, responsável pelo conteúdo publicado e pelo tratamento dos dados pessoais descritos nesta página.',
        ],
      },
      {
        heading: 'Visitantes',
        paragraphs: [
          'O portal não tem cadastro nem login de visitantes, não usa cookies de publicidade ou de análise de navegação e não carrega serviços de terceiros no navegador.',
          'Como em qualquer site, os provedores de hospedagem registram dados técnicos das requisições, como endereço IP e tipo de navegador, para garantir a segurança e o funcionamento do serviço. Falhas técnicas são registradas em uma ferramenta de monitoramento de erros configurada para descartar e-mails, endereços IP e outros dados pessoais.',
        ],
      },
      {
        heading: 'Integrantes do grupo',
        paragraphs: [
          'Perfis de integrantes só são publicados com autorização individual do próprio titular, registrada separadamente para cada finalidade: perfil público, fotografia e e-mail. Cada autorização pode ser revogada a qualquer momento, e a revogação retira a informação correspondente do portal imediatamente.',
          'A autorização geral do grupo não substitui a autorização individual de cada pessoa.',
        ],
        items: [
          'Não coletamos CPF, matrícula, data de nascimento, telefone pessoal nem endereço.',
          'O e-mail de um integrante só é exibido se ele autorizar expressamente.',
          'O portal não armazena dados clínicos nem dados de participantes de pesquisa.',
        ],
      },
      {
        heading: 'Autores do blog',
        paragraphs: [
          'Os ensaios exibem o nome publicado de cada autor. O link para o perfil do autor só aparece quando ele autorizou a publicação do próprio perfil.',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'O portal só define cookies para as contas administrativas, restritas ao coordenador do grupo e ao desenvolvedor responsável, e apenas o necessário para manter a sessão no painel. Visitantes não recebem cookies do portal.',
        ],
      },
      {
        heading: 'Onde os dados ficam',
        paragraphs: [
          'Os dados são armazenados em provedores de infraestrutura em nuvem: Vercel (aplicação), Neon (banco de dados), Cloudflare (arquivos e cópias de segurança criptografadas) e Sentry (registro de erros, sem dados pessoais). Sempre que possível, usamos as regiões mais próximas do Brasil. Alguns desses provedores podem processar dados fora do país, o que caracteriza transferência internacional de dados (art. 33 da LGPD).',
          'O acesso administrativo é restrito a duas contas, e as alterações de conteúdo ficam registradas em um histórico de auditoria.',
        ],
      },
      {
        heading: 'Seus direitos',
        paragraphs: ['Como titular de dados, você pode solicitar, a qualquer momento:'],
        items: [
          'confirmação de que tratamos dados seus e acesso a eles;',
          'correção de dados incompletos, inexatos ou desatualizados;',
          'anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei;',
          'informação sobre o compartilhamento dos seus dados;',
          'revogação da autorização e eliminação dos dados tratados com base nela.',
        ],
      },
      {
        heading: 'Como fazer um pedido',
        paragraphs: [
          {
            before:
              'Para exercer seus direitos ou pedir a retirada de qualquer informação, use o canal do grupo indicado na página ',
            link: CONTACT,
            after: '. Os pedidos são registrados e respondidos pelo grupo.',
          },
          `Última atualização desta política: ${LEGAL_REVIEWED_AT}.`,
        ],
      },
    ],
  },
  acessibilidade: {
    title: 'Acessibilidade',
    summary: 'O compromisso do portal com a acessibilidade digital e como relatar uma barreira.',
    sections: [
      {
        heading: 'Compromisso',
        paragraphs: [
          'O portal busca atender às Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.2, nível AA, em todas as páginas públicas.',
        ],
      },
      {
        heading: 'Recursos adotados',
        items: [
          'Navegação completa pelo teclado, com foco visível e atalho “Pular para o conteúdo”.',
          'Títulos e regiões da página estruturados para leitores de tela.',
          'Contraste de cores verificado conforme o nível AA.',
          'Texto alternativo obrigatório em todas as imagens publicadas.',
          'Páginas adaptadas a telas pequenas, sem rolagem horizontal.',
          'Verificação automatizada de acessibilidade a cada alteração do portal.',
        ],
      },
      {
        heading: 'Limitações conhecidas',
        paragraphs: [
          'Testes automatizados não detectam todas as barreiras. Links para sites externos e documentos de terceiros podem não seguir os mesmos critérios.',
        ],
      },
      {
        heading: 'Relatar uma barreira',
        paragraphs: [
          {
            before:
              'Se encontrar dificuldade para acessar algum conteúdo, informe a página e o problema pelo canal indicado em ',
            link: CONTACT,
            after: '. Sua mensagem ajuda a corrigir o problema.',
          },
          `Última revisão desta declaração: ${LEGAL_REVIEWED_AT}.`,
        ],
      },
    ],
  },
  'sobre-o-portal': {
    title: 'Sobre o portal',
    summary: 'Quem mantém o portal, de onde vêm as informações e como pedir correções.',
    sections: [
      {
        heading: 'O que você encontra aqui',
        items: [
          'Apresentação, histórico e objetivos do grupo.',
          'As linhas temáticas Bioética e Promoção da Saúde.',
          'Integrantes que autorizaram a publicação de seus perfis.',
          'O blog acadêmico, com ensaios do grupo.',
        ],
      },
      {
        heading: 'Origem das informações',
        paragraphs: [
          'Os dados institucionais são transcritos de fontes públicas, como o registro do grupo no Diretório dos Grupos de Pesquisa do CNPq, com indicação de fonte e data. Textos ainda em validação pelo grupo são sinalizados como provisórios.',
        ],
      },
      {
        heading: 'Correções e retirada de informações',
        paragraphs: [
          {
            before:
              'Pedidos de correção, de retirada de menções ou de dados pessoais podem ser feitos pelo canal indicado em ',
            link: CONTACT,
            after: '.',
          },
        ],
      },
    ],
  },
}

/** Texto discreto de responsabilidade (Q1): sempre exibido em "Sobre o portal". */
export const RESPONSIBILITY_STATEMENT =
  'Este portal é uma iniciativa do Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar, que o mantém e responde pelo seu conteúdo.'
