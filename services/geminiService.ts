import { GoogleGenAI } from "@google/genai";
import { YearScores, BimesterAverages, AIAnalysisResult, SubjectMap } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize purely if key exists to avoid immediate crash, handle check later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// List of subjects to scan for during bulk import
// ATENÇÃO: Esta lista deve estar sincronizada com a do App.tsx
const KNOWN_SUBJECTS = [
  "Filosofia", "Geografia", "Artes", "Química", "Inglês", "Física",
  "Matemática", "Biologia", "História", "Literatura", "Gramática",
  "Interpretação de Texto", "Educação Física", "Redação", "Sociologia",
  "Espanhol", "Projeto de Vida"
];

export const analyzeGrades = async (
  scores: YearScores,
  averages: BimesterAverages,
  finalAverage: number | null
): Promise<AIAnalysisResult> => {
  if (!ai) {
    return {
      message: "API Key não configurada. Não é possível gerar dicas de IA.",
      actionableTips: [],
      status: 'error'
    };
  }

  try {
    const prompt = `
      Atue como um conselheiro pedagógico escolar experiente e motivador para um aluno brasileiro.
      
      O sistema de notas é: 
      - 4 Bimestres (B1, B2, B3, B4).
      - Cada bimestre tem 3 notas: TM (Teste Mensal), TB (Teste Bimestral), TD (Trabalhos/Diversos).
      - A média para passar é 7.0.
      
      Aqui estão os dados do aluno:
      
      Bimestre 1: TM=${scores.b1.tm || '-'}, TB=${scores.b1.tb || '-'}, TD=${scores.b1.td || '-'} (Média: ${averages.b1?.toFixed(1) || '-'})
      Bimestre 2: TM=${scores.b2.tm || '-'}, TB=${scores.b2.tb || '-'}, TD=${scores.b2.td || '-'} (Média: ${averages.b2?.toFixed(1) || '-'})
      Bimestre 3: TM=${scores.b3.tm || '-'}, TB=${scores.b3.tb || '-'}, TD=${scores.b3.td || '-'} (Média: ${averages.b3?.toFixed(1) || '-'})
      Bimestre 4: TM=${scores.b4.tm || '-'}, TB=${scores.b4.tb || '-'}, TD=${scores.b4.td || '-'} (Média: ${averages.b4?.toFixed(1) || '-'})
      
      Média Final Atual: ${finalAverage?.toFixed(1) || '-'}
      
      Por favor, forneça:
      1. Uma breve análise geral do desempenho (máximo 2 frases).
      2. Uma lista de 3 a 4 dicas práticas e acionáveis ("actionableTips") em formato JSON array para o aluno melhorar ou manter as notas. Se o aluno estiver reprovando, diga exatamente quanto falta para passar.
      
      Responda EXCLUSIVAMENTE em JSON no seguinte formato:
      {
        "analysis": "string",
        "tips": ["string", "string", "string"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("Sem resposta da IA");

    const json = JSON.parse(textResponse);

    return {
      message: json.analysis,
      actionableTips: json.tips,
      status: 'success'
    };

  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return {
      message: "Desculpe, ocorreu um erro ao analisar suas notas. Tente novamente mais tarde.",
      actionableTips: [],
      status: 'error'
    };
  }
};

/**
 * Parsing local ROBUSTO e SEQUENCIAL.
 */
const localFastParse = (text: string, subject: string): YearScores | null => {
  if (!text || !subject) return null;

  // 1. Normalização
  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanText = normalize(text);
  const normalizedSubject = normalize(subject);

  // 2. Definir variações do nome da matéria
  let searchTerms = [normalizedSubject];
  
  if (normalizedSubject === 'artes') searchTerms.push('arte');
  if (normalizedSubject === 'ingles') searchTerms.push('lingua inglesa');
  if (normalizedSubject === 'espanhol') searchTerms.push('lingua espanhola');
  if (normalizedSubject === 'gramatica') searchTerms.push('lingua portuguesa');
  if (normalizedSubject === 'interpretacao de texto') searchTerms.push('lingua portuguesa');
  if (normalizedSubject.includes('portugues')) searchTerms.push('lingua portuguesa');
  
  // 3. Encontrar start index
  let startIndex = -1;
  let foundTerm = '';

  for (const term of searchTerms) {
    let pos = cleanText.indexOf(term);
    
    // Tratamento de colisão: "Física" dentro de "Educação Física"
    while (pos !== -1) {
      const isPartOfEducation = term === 'fisica' && 
        cleanText.substring(Math.max(0, pos - 15), pos).includes('educacao');
      
      if (!isPartOfEducation) {
        startIndex = pos;
        foundTerm = term;
        break; 
      }
      pos = cleanText.indexOf(term, pos + 1);
    }
    
    if (startIndex !== -1) break;
  }

  if (startIndex === -1) return null;

  // 4. Encontrar end index (próxima matéria)
  const allSubjects = [
    "arte", "biologia", "educacao fisica", "filosofia", "fisica", 
    "geografia", "historia", "literatura", "lingua espanhola", 
    "lingua inglesa", "lingua portuguesa", "matematica", 
    "projeto de vida", "quimica", "redacao", "sociologia"
  ];

  let endIndex = cleanText.length;
  const searchStartPos = startIndex + foundTerm.length;

  for (const sub of allSubjects) {
    if (foundTerm.includes(sub) || sub.includes(foundTerm)) continue;
    
    // Procura a próxima matéria APÓS o início da matéria atual
    const idx = cleanText.indexOf(sub, searchStartPos);
    
    if (sub === 'fisica') {
       const isFakePhysics = cleanText.substring(Math.max(0, idx - 15), idx).includes('educacao');
       if (isFakePhysics) continue;
    }

    if (idx !== -1 && idx < endIndex) {
      endIndex = idx;
    }
  }

  let sectionText = cleanText.slice(startIndex, endIndex);

  // 4.5 REMOVER "Total X Semestre" para ignorar (pedido do usuário)
  // Remove linhas ou trechos que contenham "total" seguido de "semestre"
  // O regex remove "total" ... até o próximo número ou quebra de linha para evitar pegar o valor
  sectionText = sectionText.replace(/total\s*.*semestre.*(\n|$)/g, " ");

  // 5. Extração
  const findValue = (labelRegex: RegExp): number | null => {
    const matchLabel = labelRegex.exec(sectionText);
    
    if (!matchLabel) return null;

    // Pega o texto a partir do fim do label
    const textAfterLabel = sectionText.slice(matchLabel.index + matchLabel[0].length);
    
    // Procura o PRIMEIRO número (inteiro ou decimal com , ou .)
    const matchNumber = textAfterLabel.match(/(\d+([.,]\d+)?)/);
    
    if (matchNumber) {
      return parseFloat(matchNumber[0].replace(',', '.'));
    }
    return null;
  };

  // Extrair notas dos bimestres
  let v1 = findValue(/1[ºo°]?\s*bimestre/);
  let v2 = findValue(/2[ºo°]?\s*bimestre/);
  let v3 = findValue(/3[ºo°]?\s*bimestre/);
  let v4 = findValue(/4[ºo°]?\s*bimestre/);

  // Extrair notas de RECUPERAÇÃO (Rec)
  const rec1 = findValue(/rec(uperacao)?\s*1[ºo°]?\s*semestre/);
  const rec2 = findValue(/rec(uperacao)?\s*2[ºo°]?\s*semestre/);

  // APLICAR LÓGICA DE RECUPERAÇÃO:
  // "o calculo dele é divido por 4 e somado no 2 bimestre" (para Rec 1º Sem)
  // Estendendo lógica para 2º Semestre -> Soma no 4º Bimestre
  if (rec1 !== null) {
    const bonus = rec1 / 4;
    v2 = (v2 || 0) + bonus;
  }

  if (rec2 !== null) {
    const bonus = rec2 / 4;
    v4 = (v4 || 0) + bonus;
  }

  if (v1 === null && v2 === null && v3 === null && v4 === null) return null;

  const fmt = (val: number | null) => val !== null ? val.toFixed(2) : '';

  // Mapeia para TB (Teste Bimestral) pois é o formato de resultado geral
  return {
    b1: { tm: '', tb: fmt(v1), td: '' },
    b2: { tm: '', tb: fmt(v2), td: '' },
    b3: { tm: '', tb: fmt(v3), td: '' },
    b4: { tm: '', tb: fmt(v4), td: '' }
  };
};

/**
 * Função principal de Importação.
 * Agora percorre TODAS as matérias conhecidas e tenta extrair notas para cada uma.
 */
export const parseGradesFromText = async (text: string): Promise<SubjectMap> => {
  const results: SubjectMap = {};
  
  // Itera sobre todas as matérias conhecidas
  for (const subject of KNOWN_SUBJECTS) {
    const scores = localFastParse(text, subject);
    if (scores) {
      results[subject] = scores;
    }
  }
  
  return results;
};
