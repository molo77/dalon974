import { MetadataRoute } from 'next'
import prisma from '@/infrastructure/database/prismaClient'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rodcoloc.re'
  
  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/annonces`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/colocataires`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/politique-confidentialite`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    // Pages dynamiques - Annonces approuvées
    const annonces = await prisma.annonce.findMany({
      where: {
        moderationStatus: 'approved'
      },
      select: {
        id: true,
        updatedAt: true,
        ville: true,
        title: true
      },
      take: 1000 // Limite pour éviter un sitemap trop volumineux
    })

    const annoncePages: MetadataRoute.Sitemap = annonces.map((annonce) => ({
      url: `${baseUrl}/annonces/${annonce.id}`,
      lastModified: annonce.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    // Pages dynamiques - Profils de colocataires
    const colocProfiles = await prisma.colocProfile.findMany({
      select: {
        id: true,
        updatedAt: true,
        title: true
      },
      take: 500
    })

    const colocPages: MetadataRoute.Sitemap = colocProfiles.map((profile) => ({
      url: `${baseUrl}/colocataires/${profile.id}`,
      lastModified: profile.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    // Pages par ville (si on a des annonces par ville)
    const villes = await prisma.annonce.findMany({
      where: {
        moderationStatus: 'approved',
        ville: { not: null }
      },
      select: {
        ville: true
      },
      distinct: ['ville']
    })

    const villePages: MetadataRoute.Sitemap = villes
      .filter(annonce => annonce.ville)
      .map((annonce) => ({
        url: `${baseUrl}/annonces?ville=${encodeURIComponent(annonce.ville!)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }))

    return [...staticPages, ...annoncePages, ...colocPages, ...villePages]
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error)
    // En cas d'erreur, retourner au moins les pages statiques
    return staticPages
  }
}
