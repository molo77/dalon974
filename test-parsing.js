function parseConversationId(conversationId) {
  const parts = conversationId.split('-');
  
  let participant2 = '';
  let participant1 = '';
  let annonceId = '';
  
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!participant2) {
      if (i >= 4) {
        const potentialUuid = parts.slice(i - 4, i + 1).join('-');
        if (potentialUuid.length === 36) {
          participant2 = potentialUuid;
          i = i - 4;
          continue;
        }
      }
    }
    
    if (participant2 && !participant1) {
      if (i >= 4) {
        const potentialUuid = parts.slice(i - 4, i + 1).join('-');
        if (potentialUuid.length === 36) {
          participant1 = potentialUuid;
          annonceId = parts.slice(0, i - 4).join('-');
          break;
        }
      }
    }
  }
  
  return { annonceId, participant1, participant2 };
}

const conversationId = 'cc35f133-1417-4870-8851-3a26d7812e2d-b2ff2855-73f5-4bd9-b647-1a822da6be62-c592627e-3633-4cf0-a694-ad7953eec0c8';
const result = parseConversationId(conversationId);
console.log('Result:', result);
console.log('User matches participant2:', 'c592627e-3633-4cf0-a694-ad7953eec0c8' === result.participant2);
