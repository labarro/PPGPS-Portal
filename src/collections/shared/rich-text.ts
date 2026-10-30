import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

/**
 * Editor de texto rico do conteúdo público (S03). Somente recursos que o renderizador próprio
 * (`src/components/rich-text`) sabe exibir com segurança: sem HTML bruto, sem incorporações,
 * sem imagens dentro do texto (imagens exigem as regras de mídia e consentimento).
 * Títulos começam em h2: o h1 é sempre o título da página.
 */
export const contentEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    LinkFeature({ enabledCollections: ['pages', 'research-lines'] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

/**
 * Editor dos ensaios (S05; planejamento 8.8): títulos (h2–h4), parágrafos, listas, citações,
 * links (inclusive para outros ensaios), sobrescrito/subscrito para chamadas de nota e
 * imagens da coleção `media` — que exige texto alternativo, crédito, licença e autorização de
 * imagem. Sem HTML bruto nem incorporações. A colagem é higienizada no navegador (somente os
 * nós destes recursos existem) e, de novo, no servidor (`sanitizeLexical`).
 */
export const essayEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    SuperscriptFeature(),
    SubscriptFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    LinkFeature({ enabledCollections: ['pages', 'research-lines', 'essays'] }),
    UploadFeature({ enabledCollections: ['media'] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
