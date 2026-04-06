export type ProjectStatus = 'Abierta' | 'Cerrada';

export interface Project {
  id?: string;
  title: string;
  client: string;
  description: string; // Job Description
  conditions: string;   // Salary, benefits, etc.
  location: string;    // City/Country
  modality: 'Presencial' | 'Híbrido' | 'Remoto';
  status: ProjectStatus;
  createdAt: number;
  startDate: string;
  endDate?: string;      // Required if status is Cerrada
  closingReason?: 'Proceso completado' | 'Proceso suspendido'; // Required if status is Cerrada
}

export type CandidateStatus =
  | 'PRESELECCIONADOS'
  | 'CONTACTADOS'
  | 'ENTREVISTA (CONSULTORA)'
  | 'ENTREVISTA TÉCNICA (CLIENTE)'
  | 'PREOCUPACIONALES'
  | 'OFERTA'
  | 'CONTRATADOS'
  | 'DESCARTADOS';

export interface Candidate {
  id?: string;
  documentId?: string; // DNI/CI
  projectId: string;
  name: string;
  email: string;
  phone: string;
  status: CandidateStatus;
  tags: string[];
  cvUrl?: string; // Firebase Storage URL
  report?: string;
  cvPath?: string; // Firebase Storage internal path
  createdAt: number;
  discardInfo?: {
    instance: string;
    reason: string;
    discardedAt: number;
    previousStatus: CandidateStatus;
  };
  history?: {
    stage: CandidateStatus;
    date: number;
  }[];
  location?: string;
  links?: {
    linkedin?: string;
  };
  experience?: string;
  education?: {
    degree: string;
    institution: string;
    period: string;
  }[];
  aiSummary?: string;
  expectedSalary?: string | number;
  interviewNotes?: string;
}
