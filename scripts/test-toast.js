#!/usr/bin/env node

const fetch = require('node-fetch');

async function testToast() {
  try {
    console.log('🧪 Test des toasts...');
    
    // Test de modification d'un champ de configuration
    const response = await fetch('http://localhost:3001/api/admin/scraper/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        LBC_DEBUG: 'true'
      })
    });
    
    if (response.ok) {
      console.log('✅ Requête envoyée avec succès');
      console.log('📝 Vérifiez que le toast "Config sauvegardée automatiquement ✅" apparaît en bas à droite');
    } else {
      console.log('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }
}

testToast();

