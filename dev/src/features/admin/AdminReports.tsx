"use client";

import { useState, useEffect } from "react";

type AdminReportsProps = {
  showToast: (type: "success" | "error", message: string) => void;
};

interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedItemId: string;
  reportedItemType: 'annonce' | 'coloc_profile' | 'user';
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reportedUser: {
    id: string;
    name: string;
    email: string;
  };
  reportedItem?: {
    id: string;
    title: string;
    type: string;
  };
}

interface BlockedUser {
  id: string;
  blockerId: string;
  blockedUserId: string;
  reason?: string;
  createdAt: string;
  blocker: {
    id: string;
    name: string;
  };
  blockedUser: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminReports({ showToast }: AdminReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'blocks'>('reports');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockedUser | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Simuler le chargement des données (à remplacer par de vraies API)
      const mockReports: Report[] = [
        {
          id: "1",
          reporterId: "user1",
          reportedUserId: "user2",
          reportedItemId: "annonce1",
          reportedItemType: "annonce",
          reason: "Contenu inapproprié",
          description: "Cette annonce contient des informations fausses et trompeuses.",
          status: "pending",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z",
          reporter: {
            id: "user1",
            name: "Marie Dupont",
            email: "marie@example.com"
          },
          reportedUser: {
            id: "user2",
            name: "Jean Martin",
            email: "jean@example.com"
          },
          reportedItem: {
            id: "annonce1",
            title: "Colocation T3 Saint-Denis",
            type: "annonce"
          }
        },
        {
          id: "2",
          reporterId: "user3",
          reportedUserId: "user4",
          reportedItemId: "profile1",
          reportedItemType: "coloc_profile",
          reason: "Comportement suspect",
          description: "Ce profil semble être un faux compte ou contient des informations suspectes.",
          status: "reviewed",
          createdAt: "2024-01-14T15:45:00Z",
          updatedAt: "2024-01-14T16:20:00Z",
          reporter: {
            id: "user3",
            name: "Sophie Leroy",
            email: "sophie@example.com"
          },
          reportedUser: {
            id: "user4",
            name: "Pierre Durand",
            email: "pierre@example.com"
          },
          reportedItem: {
            id: "profile1",
            title: "Profil colocataire",
            type: "coloc_profile"
          }
        }
      ];

      const mockBlockedUsers: BlockedUser[] = [
        {
          id: "1",
          blockerId: "user1",
          blockedUserId: "user2",
          reason: "Messages inappropriés",
          createdAt: "2024-01-13T09:15:00Z",
          blocker: {
            id: "user1",
            name: "Marie Dupont"
          },
          blockedUser: {
            id: "user2",
            name: "Jean Martin",
            email: "jean@example.com"
          }
        }
      ];

      setReports(mockReports);
      setBlockedUsers(mockBlockedUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des signalements:', error);
      showToast("error", "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      // Simuler l'action (à remplacer par de vraies API)
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: action === 'resolve' ? 'resolved' : 'dismissed', updatedAt: new Date().toISOString() }
          : report
      ));
      
      showToast("success", `Signalement ${action === 'resolve' ? 'résolu' : 'rejeté'} avec succès`);
      setSelectedReport(null);
    } catch (error) {
      showToast("error", "Erreur lors de l'action sur le signalement");
    }
  };

  const handleUnblockUser = async (blockId: string) => {
    try {
      // Simuler la suppression du blocage (à remplacer par de vraies API)
      setBlockedUsers(prev => prev.filter(block => block.id !== blockId));
      showToast("success", "Utilisateur débloqué avec succès");
      setSelectedBlock(null);
    } catch (error) {
      showToast("error", "Erreur lors du déblocage");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'dismissed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'reviewed': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'dismissed': return 'Rejeté';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Signalements et blocages</h2>
            <p className="text-gray-600">Gérez les signalements et les utilisateurs bloqués</p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{reports.filter(r => r.status === 'reviewed').length}</div>
            <div className="text-sm text-gray-600">En cours</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'resolved').length}</div>
            <div className="text-sm text-gray-600">Résolus</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{blockedUsers.length}</div>
            <div className="text-sm text-gray-600">Bloqués</div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Signalements ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'blocks'
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Utilisateurs bloqués ({blockedUsers.length})
        </button>
      </div>

      {/* Contenu des signalements */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun signalement</h3>
              <p className="text-gray-500">Aucun signalement en cours pour le moment</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Signalement #{report.id}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Raison:</strong> {report.reason}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Signalé par:</strong> {report.reporter.name} ({report.reporter.email})
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Utilisateur signalé:</strong> {report.reportedUser.name} ({report.reportedUser.email})
                      </div>
                      {report.reportedItem && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Élément signalé:</strong> {report.reportedItem.title} ({report.reportedItemType})
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        <strong>Description:</strong> {report.description}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Voir détails
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReportAction(report.id, 'resolve')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Résoudre
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Signalé le {new Date(report.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenu des utilisateurs bloqués */}
      {activeTab === 'blocks' && (
        <div className="space-y-4">
          {blockedUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun utilisateur bloqué</h3>
              <p className="text-gray-500">Aucun utilisateur n'est actuellement bloqué</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {blockedUsers.map((block) => (
                <div key={block.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Blocage #{block.id}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Bloqué
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Bloqué par:</strong> {block.blocker.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Utilisateur bloqué:</strong> {block.blockedUser.name} ({block.blockedUser.email})
                      </div>
                      {block.reason && (
                        <div className="text-sm text-gray-600">
                          <strong>Raison:</strong> {block.reason}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setSelectedBlock(block)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Voir détails
                      </button>
                      <button
                        onClick={() => handleUnblockUser(block.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Débloquer
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Bloqué le {new Date(block.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de détail du signalement */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-3 right-3 text-slate-600 hover:text-slate-900"
              aria-label="Fermer"
            >
              ✖
            </button>
            <h3 className="text-xl font-semibold mb-4">Détail du signalement #{selectedReport.id}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Informations générales</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div><strong>Statut:</strong> <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedReport.status)}`}>{getStatusText(selectedReport.status)}</span></div>
                  <div><strong>Raison:</strong> {selectedReport.reason}</div>
                  <div><strong>Type d'élément:</strong> {selectedReport.reportedItemType}</div>
                  <div><strong>Date de signalement:</strong> {new Date(selectedReport.createdAt).toLocaleString('fr-FR')}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Signalé par</h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div><strong>Nom:</strong> {selectedReport.reporter.name}</div>
                  <div><strong>Email:</strong> {selectedReport.reporter.email}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Utilisateur signalé</h4>
                <div className="bg-red-50 rounded-lg p-4">
                  <div><strong>Nom:</strong> {selectedReport.reportedUser.name}</div>
                  <div><strong>Email:</strong> {selectedReport.reportedUser.email}</div>
                </div>
              </div>

              {selectedReport.reportedItem && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Élément signalé</h4>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div><strong>Titre:</strong> {selectedReport.reportedItem.title}</div>
                    <div><strong>Type:</strong> {selectedReport.reportedItem.type}</div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description du signalement</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedReport.description}</p>
                </div>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleReportAction(selectedReport.id, 'resolve')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Résoudre le signalement
                  </button>
                  <button
                    onClick={() => handleReportAction(selectedReport.id, 'dismiss')}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Rejeter le signalement
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de détail du blocage */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBlock(null)}
              className="absolute top-3 right-3 text-slate-600 hover:text-slate-900"
              aria-label="Fermer"
            >
              ✖
            </button>
            <h3 className="text-xl font-semibold mb-4">Détail du blocage #{selectedBlock.id}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Informations générales</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div><strong>Date de blocage:</strong> {new Date(selectedBlock.createdAt).toLocaleString('fr-FR')}</div>
                  {selectedBlock.reason && <div><strong>Raison:</strong> {selectedBlock.reason}</div>}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Bloqué par</h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div><strong>Nom:</strong> {selectedBlock.blocker.name}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Utilisateur bloqué</h4>
                <div className="bg-red-50 rounded-lg p-4">
                  <div><strong>Nom:</strong> {selectedBlock.blockedUser.name}</div>
                  <div><strong>Email:</strong> {selectedBlock.blockedUser.email}</div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleUnblockUser(selectedBlock.id)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Débloquer l'utilisateur
                </button>
                <button
                  onClick={() => setSelectedBlock(null)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
