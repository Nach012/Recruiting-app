import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION_NAME = "projects";

/**
 * Script de migración de única ejecución.
 * Asigna el ownerId especificado a todos los proyectos en Firestore que no tengan dueño.
 */
export async function migrateMissingOwners(targetUid: string): Promise<{ migratedCount: number; error?: string }> {
  try {
    const projectsRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(projectsRef);
    
    let migratedCount = 0;
    
    for (const document of querySnapshot.docs) {
      const data = document.data();
      // Si el proyecto no tiene ownerId, se lo asignamos
      if (!data.ownerId) {
        const docRef = doc(db, COLLECTION_NAME, document.id);
        await updateDoc(docRef, { ownerId: targetUid });
        migratedCount++;
      }
    }
    
    console.log(`✅ [Migration] Proceso finalizado. Se migraron ${migratedCount} proyectos.`);
    return { migratedCount };
  } catch (error: any) {
    console.error("❌ [Migration] Error al migrar proyectos:", error);
    return { migratedCount: 0, error: error.message };
  }
}
