import * as XLSX from 'xlsx';
import type { Candidate } from '../types';

/**
 * Exporta una lista de candidatos a un archivo Excel (.xlsx)
 * siguiendo el formato de la Iteración 21.
 */
export const exportCandidatesToExcel = (candidates: Candidate[], projectName: string) => {
  // 1. Preparar los datos para la tabla
  const data = candidates.map(c => ({
    'Nombre Completo': c.name,
    'Email': c.email,
    'Teléfono': c.phone,
    'Ciudad': c.location || '—',
    'LinkedIn': c.links?.linkedin || '—',
    'Etapa Actual': c.status,
    'Skills': c.tags.join(', '),
    'Motivo de Descarte': c.discardInfo ? `${c.discardInfo.instance}: ${c.discardInfo.reason}` : '—'
  }));

  // 2. Crear el libro de trabajo y la hoja
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidatos');

  // 3. Generar el nombre del archivo
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Reporte_Candidatos_${projectName.replace(/\s+/g, '_')}_${dateStr}.xlsx`;

  // 4. Descargar el archivo
  XLSX.writeFile(workbook, fileName);
};
