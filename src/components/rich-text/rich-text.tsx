import Image from 'next/image'
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'

import {
  hasFormat,
  headingLevel,
  isExternalHref,
  isRichTextEmpty,
  type LexicalNode,
  type LexicalState,
  linkHref,
  TEXT_FORMAT,
  uploadImage,
} from '@/lib/content/rich-text'
import { cn } from '@/lib/utils'

/**
 * Renderizador PRÓPRIO do Lexical (AGENTS.md §4.7): converte o JSON em elementos React —
 * nunca `dangerouslySetInnerHTML`. O React escapa todo texto; links passam por `safeHref`.
 */
type RenderOptions = { baseHeading: number }

function renderText(node: LexicalNode, key: string): ReactNode {
  let content: ReactNode = node.text ?? ''
  const format = node.format
  if (hasFormat(format, TEXT_FORMAT.code)) content = <code>{content}</code>
  if (hasFormat(format, TEXT_FORMAT.subscript)) content = <sub>{content}</sub>
  if (hasFormat(format, TEXT_FORMAT.superscript)) content = <sup>{content}</sup>
  if (hasFormat(format, TEXT_FORMAT.strikethrough)) content = <s>{content}</s>
  if (hasFormat(format, TEXT_FORMAT.underline)) content = <u>{content}</u>
  if (hasFormat(format, TEXT_FORMAT.italic)) content = <em>{content}</em>
  if (hasFormat(format, TEXT_FORMAT.bold)) content = <strong>{content}</strong>
  return <Fragment key={key}>{content}</Fragment>
}

function renderChildren(node: LexicalNode, options: RenderOptions, prefix: string): ReactNode[] {
  return (node.children ?? []).map((child, index) =>
    renderNode(child, options, `${prefix}-${index}`),
  )
}

function renderLink(node: LexicalNode, options: RenderOptions, key: string): ReactNode {
  const children = renderChildren(node, options, key)
  const href = linkHref(node)
  if (!href) return <Fragment key={key}>{children}</Fragment>
  if (isExternalHref(href)) {
    const newTab = node.fields?.newTab === true
    return (
      <a key={key} href={href} rel="noopener noreferrer" {...(newTab ? { target: '_blank' } : {})}>
        {children}
        {newTab ? <span className="sr-only"> (abre em nova aba)</span> : null}
      </a>
    )
  }
  return (
    <Link key={key} href={href}>
      {children}
    </Link>
  )
}

function renderNode(node: LexicalNode, options: RenderOptions, key: string): ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node, key)
    case 'linebreak':
      return <br key={key} />
    case 'tab':
      return <Fragment key={key}> </Fragment>
    case 'paragraph': {
      const children = renderChildren(node, options, key)
      return children.length > 0 ? <p key={key}>{children}</p> : null
    }
    case 'heading': {
      const level = headingLevel(node.tag, options.baseHeading)
      const Tag = `h${level}` as const
      return <Tag key={key}>{renderChildren(node, options, key)}</Tag>
    }
    case 'quote':
      return <blockquote key={key}>{renderChildren(node, options, key)}</blockquote>
    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return <Tag key={key}>{renderChildren(node, options, key)}</Tag>
    }
    case 'listitem': {
      // Sublista: o Lexical aninha a lista dentro de um item sem texto próprio.
      return <li key={key}>{renderChildren(node, options, key)}</li>
    }
    case 'link':
    case 'autolink':
      return renderLink(node, options, key)
    case 'horizontalrule':
      return <hr key={key} />
    case 'upload': {
      // S05: imagem da coleção de mídias (alt, crédito e licença obrigatórios); somente se o
      // visitante puder vê-la (pessoas identificáveis exigem autorização de imagem).
      const image = uploadImage(node)
      if (!image) return null
      return (
        <figure key={key}>
          <Image
            src={image.url}
            alt={image.alt}
            width={image.width ?? 1200}
            height={image.height ?? 800}
            unoptimized
            loading="lazy"
            sizes="(min-width: 768px) 68ch, 100vw"
          />
          {image.caption || image.credit ? (
            <figcaption>
              {image.caption}
              {image.caption && image.credit ? ' ' : null}
              {image.credit ? <span>Crédito: {image.credit}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      )
    }
    default:
      // Nó desconhecido/não permitido: só o conteúdo textual dos filhos, sem marcação própria.
      return node.children ? (
        <Fragment key={key}>{renderChildren(node, options, key)}</Fragment>
      ) : null
  }
}

export function RichText({
  data,
  className,
  baseHeading = 2,
}: {
  data: LexicalState | unknown
  className?: string
  /** Nível do primeiro título do texto (2 quando o texto é o corpo principal da página). */
  baseHeading?: number
}) {
  const state = data as LexicalState
  const hasImage = (state?.root?.children ?? []).some((node) => node.type === 'upload')
  if (!state?.root || (isRichTextEmpty(state) && !hasImage)) return null
  return (
    <div className={cn('prose-portal', className)}>
      {renderChildren(state.root, { baseHeading }, 'rt')}
    </div>
  )
}
