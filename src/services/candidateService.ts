import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { db, storage } from "../config/firebase";
import type { Candidate, CandidateStatus } from "../types";

const COLLECTION_NAME = "candidates";

/**
 * Servicio de Candidatos conectado a Firebase Firestore & Storage.
 */
export const candidateService = {
  /**
   * Obtiene todos los candidatos de un proyecto específico, ordenados por fecha de creación.
   */
  async getCandidatesByProject(projectId: string): Promise<Candidate[]> {
    try {
      const candidatesRef = collection(db, COLLECTION_NAME);
      const q = query(
        candidatesRef, 
        where("projectId", "==", projectId),
        orderBy("createdAt", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Candidate[];
    } catch (error) {
      console.error("Error al obtener candidatos de Firestore:", error);
      throw error;
    }
  },

  /**
   * Se suscribe a los cambios de los candidatos de un proyecto específico en tiempo real.
   */
  subscribeToProjectCandidates(
    projectId: string, 
    callback: (candidates: Candidate[]) => void,
    onError?: (error: any) => void
  ) {
    const candidatesRef = collection(db, COLLECTION_NAME);
    const q = query(
      candidatesRef, 
      where("projectId", "==", projectId),
      orderBy("createdAt", "asc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const candidates = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Candidate[];
      callback(candidates);
    }, (error) => {
      console.error("Error en suscripción de candidatos:", error);
      if (onError) onError(error);
    });
  },

  /**
   * Crea un nuevo candidato en Firestore verificando duplicados por documento.
   */
  async createCandidate(candidate: Omit<Candidate, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Verificación de duplicado real en Firestore (documentId)
      if (candidate.documentId) {
        const candidatesRef = collection(db, COLLECTION_NAME);
        const q = query(candidatesRef, where("documentId", "==", candidate.documentId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          throw new Error('DUPLICATE_DOCUMENT');
        }
      }

      const now = Date.now();
      const newCandidate = {
        ...candidate,
        createdAt: now,
        history: [
          { stage: candidate.status, date: now }
        ]
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), newCandidate);
      return docRef.id;
    } catch (error: any) {
      if (error.message === 'DUPLICATE_DOCUMENT') throw error;
      console.error("Error al crear candidato en Firestore:", error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de un candidato y registra el cambio en el historial.
   */
  async updateCandidateStatus(id: string, status: CandidateStatus, discardInfo?: Candidate['discardInfo']): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) throw new Error("Document not found");
      
      const c = docSnap.data() as Candidate;
      const history = c.history || [];
      const now = Date.now();
      
      const updates = { 
        status, 
        discardInfo: discardInfo || null, 
        history: [...history, { stage: status, date: now }]
      };
      
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error al actualizar estado del candidato en Firestore:", error);
      throw error;
    }
  },

  /**
   * Actualiza datos genéricos de un candidato.
   */
  async updateCandidate(id: string, candidate: Partial<Candidate>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, candidate);
    } catch (error) {
      console.error("Error al actualizar candidato en Firestore:", error);
      throw error;
    }
  },

  /**
   * Sube un archivo PDF a Firebase Storage y retorna su URL pública y path.
   */
  async uploadCV(file: File, candidateName: string): Promise<{ url: string, path: string }> {
    try {
      const timestamp = Date.now();
      const sanitizedName = candidateName.replace(/\s+/g, '_').toLowerCase();
      const storagePath = `cvs/${sanitizedName}_${timestamp}.pdf`;
      const storageRef = ref(storageRefInstance(), storagePath);
      
      // Subir el archivo binario
      await uploadBytes(storageRef, file);
      
      // Obtener la URL pública de descarga
      const url = await getDownloadURL(storageRef);
      
      return { 
        url, 
        path: storagePath 
      };
    } catch (error) {
      console.error("Error al subir CV a Storage:", error);
      throw error;
    }
  }
};

// Función auxiliar para obtener la instancia de Storage (refactoriza el acceso seguro)
function storageRefInstance() {
  return storage;
}
