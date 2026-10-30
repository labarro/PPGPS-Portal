import Image from 'next/image'

import { initials, type PublicPhoto } from '@/lib/people/directory'
import { cn } from '@/lib/utils'

/**
 * Fotografia autorizada (escopo `photo`) ou monograma com as iniciais. O monograma é
 * decorativo (o nome está sempre ao lado), por isso fica oculto para leitores de tela.
 * Arquivo servido pela rota do Payload, que confere o acesso público antes de ler o bucket.
 */
export function PersonAvatar({
  name,
  photo,
  size = 'md',
  className,
}: {
  name: string
  photo: PublicPhoto | null
  size?: 'md' | 'lg'
  className?: string
}) {
  const box = size === 'lg' ? 'size-32 sm:size-40' : 'size-16'
  if (photo) {
    return (
      <Image
        src={photo.url}
        alt={photo.alt || `Fotografia de ${name}`}
        width={photo.width ?? 320}
        height={photo.height ?? 320}
        unoptimized
        data-testid="person-photo"
        className={cn('shrink-0 rounded-md border object-cover', box, className)}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md border border-primary/30 bg-secondary font-serif font-semibold text-primary',
        size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-xl',
        box,
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
