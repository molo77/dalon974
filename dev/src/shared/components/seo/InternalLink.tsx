import Link from 'next/link'
import { ReactNode } from 'react'

interface InternalLinkProps {
  href: string
  children: ReactNode
  className?: string
  title?: string
  prefetch?: boolean
  target?: '_blank' | '_self'
  rel?: string
}

export default function InternalLink({
  href,
  children,
  className = '',
  title,
  prefetch = true,
  target = '_self',
  rel
}: InternalLinkProps) {
  // Ajouter des attributs SEO par défaut
  const seoProps = {
    title: title || (typeof children === 'string' ? children : undefined),
    'aria-label': title || (typeof children === 'string' ? children : undefined),
  }

  // Si c'est un lien externe, ajouter les attributs de sécurité
  if (target === '_blank') {
    return (
      <Link
        href={href}
        className={className}
        target={target}
        rel={rel || 'noopener noreferrer'}
        prefetch={prefetch}
        {...seoProps}
      >
        {children}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={className}
      prefetch={prefetch}
      {...seoProps}
    >
      {children}
    </Link>
  )
}

// Composant spécialisé pour les liens de navigation
export function NavLink({ href, children, className = '', isActive = false }: {
  href: string
  children: ReactNode
  className?: string
  isActive?: boolean
}) {
  const activeClass = isActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'
  
  return (
    <InternalLink
      href={href}
      className={`transition-colors duration-200 ${activeClass} ${className}`}
    >
      {children}
    </InternalLink>
  )
}

// Composant spécialisé pour les liens de breadcrumb
export function BreadcrumbLink({ href, children, className = '' }: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <InternalLink
      href={href}
      className={`text-blue-600 hover:text-blue-800 transition-colors ${className}`}
    >
      {children}
    </InternalLink>
  )
}

// Composant spécialisé pour les liens d'action (boutons)
export function ActionLink({ href, children, className = '', variant = 'primary' }: {
  href: string
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
  }

  return (
    <InternalLink
      href={href}
      className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </InternalLink>
  )
}
