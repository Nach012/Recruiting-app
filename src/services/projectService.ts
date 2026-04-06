import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Project } from "../types";

const COLLECTION_NAME = "projects";

/**
 * Servicio de Proyectos conectado a Firebase Firestore.
 */
export const projectService = {
  /**
   * Obtiene todos los proyectos de búsqueda ordenados por fecha de creación descendente.
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      const projectsRef = collection(db, COLLECTION_NAME);
      const q = query(projectsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Project[];
    } catch (error) {
      console.error("Error al obtener proyectos de Firestore:", error);
      throw error;
    }
  },

  /**
   * Crea un nuevo proyecto en Firestore.
   */
  async createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<string> {
    try {
      const projectsRef = collection(db, COLLECTION_NAME);
      const newProject = {
        ...project,
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(projectsRef, newProject);
      return docRef.id;
    } catch (error) {
      console.error("Error al crear proyecto en Firestore:", error);
      throw error;
    }
  },

  /**
   * Actualiza un proyecto existente en Firestore.
   */
  async updateProject(id: string, project: Partial<Project>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, project);
    } catch (error) {
      console.error("Error al actualizar proyecto en Firestore:", error);
      throw error;
    }
  },

  /**
   * Elimina un proyecto de Firestore.
   */
  async deleteProject(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error al eliminar proyecto en Firestore:", error);
      throw error;
    }
  }
};
