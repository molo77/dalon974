"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reporter: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  reported: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  reviewer?: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function AdminReportsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    
    // Vérifier que l'utilisateur est admin
    if (user.role !== 'admin') {
      setError('Accès non autorisé');
      setLoading(false);
      return;
    }

    fetchReports();
  }, [user?.id, user?.role, selectedStatus]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/users/report?status=${selectedStatus}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      } else {
        setError('Erreur lors du chargement des signalements');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async (reportId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          status,
          reviewNotes
        }),
      });

      if (response.ok) {
        setSelectedReport(null);
        setReviewNotes("");
        fetchReports();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      setError('Erreur de connexion');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam ou publicité',
      harassment: 'Harcèlement',
      inappropriate: 'Contenu inapproprié',
      fake: 'Profil faux ou trompeur',
      scam: 'Tentative d\'arnaque',
      other: 'Autre'
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement des signalements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des signalements</h1>
            <p className="text-gray-600 mt-1">Examinez et traitez les signalements d'utilisateurs</p>
          </div>

          {/* Filtres */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex gap-4">
              {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'pending' && 'En attente'}
                  {status === 'reviewed' && 'Examinés'}
                  {status === 'resolved' && 'Résolus'}
                  {status === 'dismissed' && 'Rejetés'}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des signalements */}
          <div className="px-6 py-4">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun signalement trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {getReasonLabel(report.reason)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Signalé par</p>
                            <p className="text-sm text-gray-900">{report.reporter.email}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Utilisateur signalé</p>
                            <p className="text-sm text-gray-900">{report.reported.email}</p>
                          </div>
                        </div>

                        {report.description && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">Description</p>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{report.description}</p>
                          </div>
                        )}

                        {report.reviewNotes && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">Notes de l'admin</p>
                            <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">{report.reviewNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Examiner
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'examen */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Examiner le signalement</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Raison</p>
                <p className="text-sm text-gray-900">{getReasonLabel(selectedReport.reason)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Signalé par</p>
                <p className="text-sm text-gray-900">{selectedReport.reporter.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Utilisateur signalé</p>
                <p className="text-sm text-gray-900">{selectedReport.reported.email}</p>
              </div>
              
              {selectedReport.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedReport.description}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes de l'admin
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ajoutez vos notes sur ce signalement..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => handleUpdateReport(selectedReport.id, 'dismissed')}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Rejeter
              </button>
              <button
                onClick={() => handleUpdateReport(selectedReport.id, 'resolved')}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Résoudre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
