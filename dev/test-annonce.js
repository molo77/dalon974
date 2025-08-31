const fetch = require('node-fetch');

async function testCreateAnnonce() {
  try {
    console.log('Test de création d\'annonce...');
    
    const response = await fetch('http://localhost:3001/api/annonces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titre: 'Test annonce propriétaire',
        ville: 'Saint-Denis',
        prix: 500
      })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    const data = await response.text();
    console.log('Response:', data);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

testCreateAnnonce();
