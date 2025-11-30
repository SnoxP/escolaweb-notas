export interface BimesterScores {
  tm: string; // Storing as string to handle empty inputs gracefully
  tb: string;
  td: string;
  recuperacao?: string; // Nota bruta da recuperação semestral
}

export interface YearScores {
  b1: BimesterScores;
  b2: BimesterScores;
  b3: BimesterScores;
  b4: BimesterScores;
  finalResult?: string; // Nota final arredondada fornecida pela escola
}

export type SubjectMap = Record<string, YearScores>;

export interface BimesterAverages {
  b1: number | null;
  b2: number | null;
  b3: number | null;
  b4: number | null;
}

export interface SemesterAverages {
  sem1: number | null;
  sem2: number | null;
}

export type BimesterKey = 'b1' | 'b2' | 'b3' | 'b4';
export type ScoreKey = 'tm' | 'tb' | 'td' | 'recuperacao';

export interface AIAnalysisResult {
  message: string;
  actionableTips: string[];
  status: 'success' | 'error';
}