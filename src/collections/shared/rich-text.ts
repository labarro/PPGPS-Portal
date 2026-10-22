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
  UnderlineFeature,
  UnorderedListFeature,
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
