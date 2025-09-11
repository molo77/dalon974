import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth/auth';
import prisma from '@/infrastructure/database/prismaClient';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[DeleteAccount] Début de la suppression du compte pour l'utilisateur: ${userId}`);

    // Supprimer toutes les données associées à l'utilisateur
    const deleteOperations = [];

    // 1. Supprimer les annonces de l'utilisateur
    console.log(`[DeleteAccount] Suppression des annonces...`);
    const deleteAnnonces = prisma.annonce.deleteMany({
      where: { userId }
    });
    deleteOperations.push(deleteAnnonces);

    // 2. Supprimer le profil colocataire
    console.log(`[DeleteAccount] Suppression du profil colocataire...`);
    const deleteColocProfile = prisma.colocProfile.deleteMany({
      where: { userId }
    });
    deleteOperations.push(deleteColocProfile);

    // 3. Supprimer les messages envoyés par l'utilisateur
    console.log(`[DeleteAccount] Suppression des messages envoyés...`);
    const deleteSentMessages = prisma.message.deleteMany({
      where: { senderId: userId }
    });
    deleteOperations.push(deleteSentMessages);

    // 4. Supprimer les messages reçus par l'utilisateur
    console.log(`[DeleteAccount] Suppression des messages reçus...`);
    const deleteReceivedMessages = prisma.message.deleteMany({
      where: { receiverId: userId }
    });
    deleteOperations.push(deleteReceivedMessages);

    // 5. Supprimer les conversations où l'utilisateur est impliqué
    console.log(`[DeleteAccount] Suppression des conversations...`);
    const deleteConversations = prisma.conversation.deleteMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });
    deleteOperations.push(deleteConversations);

    // 6. Supprimer les préférences de cookies
    console.log(`[DeleteAccount] Suppression des préférences de cookies...`);
    const deleteCookiePreferences = prisma.cookiePreferences.deleteMany({
      where: { userId }
    });
    deleteOperations.push(deleteCookiePreferences);

    // 7. Supprimer les logs d'activité
    console.log(`[DeleteAccount] Suppression des logs d'activité...`);
    const deleteActivityLogs = prisma.activityLog.deleteMany({
      where: { userId }
    });
    deleteOperations.push(deleteActivityLogs);

    // 8. Supprimer les notifications
    console.log(`[DeleteAccount] Suppression des notifications...`);
    const deleteNotifications = prisma.notification.deleteMany({
      where: { userId }
    });
    deleteOperations.push(deleteNotifications);

    // 9. Supprimer les favoris
    console.log(`[DeleteAccount] Suppression des favoris...`);
    const deleteFavorites = prisma.favorite.deleteMany({
      where: { userId }
    });
    deleteOperations.push(deleteFavorites);

    // 10. Supprimer les vues d'annonces
    console.log(`[DeleteAccount] Suppression des vues d'annonces...`);
    const deleteAnnonceViews = prisma.annonceView.deleteMany({
      where: { userId }
    });
    deleteOperations.push(deleteAnnonceViews);

    // Exécuter toutes les suppressions en parallèle
    console.log(`[DeleteAccount] Exécution de ${deleteOperations.length} opérations de suppression...`);
    await Promise.all(deleteOperations);

    // 11. Enfin, supprimer l'utilisateur lui-même
    console.log(`[DeleteAccount] Suppression de l'utilisateur...`);
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`[DeleteAccount] Suppression complète réussie pour l'utilisateur: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Compte et toutes les données associées supprimés avec succès' 
    });

  } catch (error) {
    console.error('[DeleteAccount] Erreur lors de la suppression du compte:', error);
    
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du compte',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
