// Légers shims pour éliminer la dépendance à Firebase/Firestore côté client
// ATTENTION: ces fonctions sont des no-ops utilisées uniquement pour déverrouiller la compilation
// Les fonctionnalités dépendantes de Firestore doivent être migrées vers les routes API Prisma.

export type DocumentData = any;
export type Query<_T = any> = any;
export type QuerySnapshot<_T = any> = { docs: any[] } & Record<string, any>;

export const db: any = {};

export const collection = (..._args: any[]) => ({ __type: "collection" });
export const doc = (..._args: any[]) => ({ __type: "doc" });
export const query = (..._args: any[]) => ({ __type: "query" });
export const where = (..._args: any[]) => ({ __type: "where" });
export const orderBy = (..._args: any[]) => ({ __type: "orderBy" });
export const startAfter = (..._args: any[]) => ({ __type: "startAfter" });
export const limit = (..._args: any[]) => ({ __type: "limit" });

export const onSnapshot = (
  _q: any,
  onNext?: (snap: QuerySnapshot) => void,
  _onError?: (err: any) => void
) => {
  try { if (onNext) onNext({ docs: [] } as any); } catch {}
  return () => {};
};

export const getDoc = async (_ref: any) => ({ exists: () => false, data: () => null });
export const getDocs = async (_q: any) => ({ docs: [] });
export const getCountFromServer = async (_q: any) => ({ data: () => ({ count: 0 }) });

export const serverTimestamp = () => new Date();

// Opérations d’écriture simulées (no-op)
export const addDoc = async (..._args: any[]) => ({ id: "noop" });
export const setDoc = async (..._args: any[]) => void 0;
export const updateDoc = async (..._args: any[]) => void 0;
export const deleteDoc = async (..._args: any[]) => void 0;
