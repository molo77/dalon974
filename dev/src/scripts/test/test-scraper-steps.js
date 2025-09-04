// Test des nouvelles étapes du scraper
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testScraperSteps() {
  console.log('🧪 Test des nouvelles étapes du scraper...\n');
  
  try {
    // Créer un run de test
    const testRun = await prisma.scraperRun.create({
      data: {
        status: 'running',
        progress: 0.2,
        currentStep: 'Étape 1/5',
        currentMessage: 'Initialisation du navigateur'
      }
    });
    
    console.log('✅ Run de test créé:', testRun.id);
    
    // Simuler la progression
    await prisma.scraperRun.update({
      where: { id: testRun.id },
      data: {
        progress: 0.4,
        currentStep: 'Étape 2/5',
        currentMessage: 'Collecte des annonces'
      }
    });
    
    console.log('✅ Progression mise à jour');
    
    // Vérifier que les champs sont bien présents
    const updatedRun = await prisma.scraperRun.findUnique({
      where: { id: testRun.id }
    });
    
    console.log('📊 État du run:');
    console.log('  - Status:', updatedRun.status);
    console.log('  - Progress:', updatedRun.progress);
    console.log('  - Current Step:', updatedRun.currentStep);
    console.log('  - Current Message:', updatedRun.currentMessage);
    
    // Nettoyer le test
    await prisma.scraperRun.delete({
      where: { id: testRun.id }
    });
    
    console.log('✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testScraperSteps();

