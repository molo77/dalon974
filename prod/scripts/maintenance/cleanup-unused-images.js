const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

/**
 * Récupère toutes les images référencées dans la base de données
 */
async function getReferencedImages() {
  const referencedImages = new Set();

  try {
    // Images des annonces
    const annonces = await prisma.annonce.findMany({
      select: {
        imageUrl: true,
        photos: true
      }
    });

    annonces.forEach(annonce => {
      if (annonce.imageUrl) {
        referencedImages.add(annonce.imageUrl);
      }
      if (annonce.photos && Array.isArray(annonce.photos)) {
        annonce.photos.forEach(photo => referencedImages.add(photo));
      }
    });

    // Images des profils colocataires
    const colocs = await prisma.coloc.findMany({
      select: {
        imageUrl: true,
        photos: true
      }
    });

    colocs.forEach(coloc => {
      if (coloc.imageUrl) {
        referencedImages.add(coloc.imageUrl);
      }
      if (coloc.photos && Array.isArray(coloc.photos)) {
        coloc.photos.forEach(photo => referencedImages.add(photo));
      }
    });

    if (VERBOSE) {
      console.log(`📊 Images référencées trouvées: ${referencedImages.size}`);
    }

    return referencedImages;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des images référencées:', error);
    throw error;
  }
}

/**
 * Récupère toutes les images physiques dans le dossier uploads
 */
async function getPhysicalImages() {
  try {
    const physicalImages = new Set();
    
    // Vérifier que le dossier existe
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      console.log(`📁 Dossier uploads non trouvé: ${UPLOAD_DIR}`);
      return physicalImages;
    }

    // Lire récursivement tous les fichiers
    async function scanDirectory(dir, relativePath = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath, relativeFilePath);
        } else if (entry.isFile()) {
          // Vérifier si c'est une image
          const ext = path.extname(entry.name).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
            const uploadPath = `/uploads/${relativeFilePath}`;
            physicalImages.add(uploadPath);
          }
        }
      }
    }

    await scanDirectory(UPLOAD_DIR);
    
    if (VERBOSE) {
      console.log(`📁 Images physiques trouvées: ${physicalImages.size}`);
    }

    return physicalImages;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des images physiques:', error);
    throw error;
  }
}

/**
 * Supprime un fichier physique
 */
async function deleteFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Nettoie les images inutilisées
 */
async function cleanupUnusedImages() {
  console.log('🧹 Début du nettoyage des images inutilisées...');
  
  if (DRY_RUN) {
    console.log('🔍 Mode DRY RUN - Aucune suppression ne sera effectuée');
  }

  try {
    // Récupérer les images référencées et physiques
    const [referencedImages, physicalImages] = await Promise.all([
      getReferencedImages(),
      getPhysicalImages()
    ]);

    // Trouver les images inutilisées
    const unusedImages = new Set();
    for (const physicalImage of physicalImages) {
      if (!referencedImages.has(physicalImage)) {
        unusedImages.add(physicalImage);
      }
    }

    console.log(`📊 Résumé:`);
    console.log(`   - Images référencées: ${referencedImages.size}`);
    console.log(`   - Images physiques: ${physicalImages.size}`);
    console.log(`   - Images inutilisées: ${unusedImages.size}`);

    if (unusedImages.size === 0) {
      console.log('✅ Aucune image inutilisée trouvée');
      return;
    }

    // Afficher les images inutilisées
    if (VERBOSE) {
      console.log('\n📋 Images inutilisées:');
      for (const image of unusedImages) {
        console.log(`   - ${image}`);
      }
    }

    // Supprimer les images inutilisées
    let deletedCount = 0;
    let errorCount = 0;

    for (const image of unusedImages) {
      if (DRY_RUN) {
        console.log(`🔍 [DRY RUN] Suppression: ${image}`);
        deletedCount++;
      } else {
        console.log(`🗑️  Suppression: ${image}`);
        const success = await deleteFile(image);
        if (success) {
          deletedCount++;
        } else {
          errorCount++;
        }
      }
    }

    // Résumé final
    console.log('\n📊 Résumé du nettoyage:');
    console.log(`   - Images supprimées: ${deletedCount}`);
    if (errorCount > 0) {
      console.log(`   - Erreurs: ${errorCount}`);
    }
    
    if (!DRY_RUN) {
      console.log('✅ Nettoyage terminé');
    } else {
      console.log('🔍 Mode DRY RUN terminé');
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    await cleanupUnusedImages();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { cleanupUnusedImages };
