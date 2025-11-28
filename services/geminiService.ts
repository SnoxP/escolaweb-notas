import { GoogleGenAI } from "@google/genai";
import { YearScores, BimesterAverages, AIAnalysisResult, SubjectMap, BimesterKey } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize purely if key exists to avoid immediate crash, handle check later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// List of subjects to scan for during bulk import
// ATENÇÃO: Esta lista deve estar sincronizada com a do App.tsx
// Removidas matérias genéricas (Matemática, Biologia) que possuem versões numeradas
const KNOWN_SUBJECTS = [
  "Filosofia", "Geografia", "Artes", "Química", "Inglês", "Física",
  "Matemática I", "Matemática II", "Matemática Fundamental",
  "Biologia I", "Biologia II",
  "História", "Literatura", "Gramática",
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
const localFastParse = (fullText: string, subject: string, forceBimester?: BimesterKey | null): YearScores | null => {
  if (!fullText || !subject) return null;

  // 1. Normalização
  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanText = normalize(fullText);
  const normalizedSubject = normalize(subject);

  // 2. Definir termos de busca para a matéria
  let searchTerms = [];
  
  if (normalizedSubject === 'artes') searchTerms.push('arte');
  else if (normalizedSubject === 'ingles') searchTerms.push('lingua inglesa');
  else if (normalizedSubject === 'espanhol') searchTerms.push('lingua espanhola');
  else if (normalizedSubject === 'gramatica') searchTerms.push('lingua portuguesa'); 
  else if (normalizedSubject === 'interpretacao de texto') searchTerms.push('lingua portuguesa');
  else if (normalizedSubject.includes('portugues')) searchTerms.push('lingua portuguesa');
  
  searchTerms.unshift(normalizedSubject);
  
  // Lista de todas as matérias para servir de "Stop Words"
  const allSubjects = [
    "arte", "biologia", "biologia i", "biologia ii", 
    "educacao fisica", "filosofia", "fisica", 
    "geografia", "historia", "literatura", 
    "lingua espanhola", "lingua inglesa", "lingua portuguesa", 
    "matematica", "matematica i", "matematica ii", "matematica fundamental",
    "projeto de vida", "quimica", "redacao", "sociologia"
  ];

  // Estrutura de resultado acumulativo
  const result: YearScores = {
    b1: { tm: '', tb: '', td: '' },
    b2: { tm: '', tb: '', td: '' },
    b3: { tm: '', tb: '', td: '' },
    b4: { tm: '', tb: '', td: '' }
  };
  
  // Array para armazenar todas as ocorrências encontradas
  interface Match {
    sectionText: string;
    startIndex: number;
  }
  const matches: Match[] = [];

  // 3. Encontrar TODAS as ocorrências da matéria no texto
  let currentPos = 0;
  
  while (currentPos < cleanText.length) {
    let bestStartIndex = -1;
    let foundTermLength = 0;

    // Procura o próximo termo válido
    for (const term of searchTerms) {
      let pos = cleanText.indexOf(term, currentPos);
      
      // Tratamento de colisão (ex: "Física" em "Educação Física")
      while (pos !== -1) {
        const isPartOfEducation = term === 'fisica' && 
          cleanText.substring(Math.max(0, pos - 15), pos).includes('educacao');
        
        let isPartofRoman = false;
        if (term === 'matematica' || term === 'biologia') {
           const nextChars = cleanText.substring(pos + term.length, pos + term.length + 5).trim();
           if (nextChars.startsWith('i') || nextChars.startsWith('v') || nextChars.includes('fundamental')) {
               if (!term.includes('i') && !term.includes('fundamental')) {
                   isPartofRoman = true;
               }
           }
        }

        if (!isPartOfEducation && !isPartofRoman) {
          if (bestStartIndex === -1 || pos < bestStartIndex) {
            bestStartIndex = pos;
            foundTermLength = term.length;
          }
          break; 
        }
        pos = cleanText.indexOf(term, pos + 1);
      }
    }

    if (bestStartIndex === -1) break;

    const sectionStart = bestStartIndex;
    currentPos = bestStartIndex + foundTermLength; 

    // Determinar FIM da seção
    let sectionEnd = cleanText.length;
    for (const sub of allSubjects) {
      if (cleanText.substring(sectionStart, sectionStart + foundTermLength).includes(sub)) continue; 
      
      const idx = cleanText.indexOf(sub, sectionStart + foundTermLength);
      
      if (sub === 'fisica') {
         const isFakePhysics = cleanText.substring(Math.max(0, idx - 15), idx).includes('educacao');
         if (isFakePhysics) continue;
      }

      if (idx !== -1 && idx < sectionEnd) {
        sectionEnd = idx;
      }
    }

    let sectionText = cleanText.slice(sectionStart, sectionEnd);
    sectionText = sectionText.replace(/total\s*.*semestre.*(\n|$)/g, " ");
    
    matches.push({
      sectionText,
      startIndex: sectionStart
    });
    
    // Atualiza ponteiro para buscar próxima ocorrência
    currentPos = sectionEnd; 
  }

  if (matches.length === 0) return null;

  let hasAnyData = false;

  // 4. Processar Matches com Lógica de Sequência ou Header
  matches.forEach((match, index) => {
    let detectedBimester: BimesterKey | null = null;

    if (forceBimester) {
      detectedBimester = forceBimester;
    } else {
      // --- Lógica de Detecção Inteligente ---
      
      // A) Se tivermos múltiplas ocorrências, assumimos SEQUÊNCIA (B1 -> B2 -> B3 -> B4)
      // Isso resolve o problema de colar "Notas Parciais" completas com todos os bimestres.
      if (matches.length > 1) {
        if (index === 0) detectedBimester = 'b1';
        else if (index === 1) detectedBimester = 'b2';
        else if (index === 2) detectedBimester = 'b3';
        else if (index === 3) detectedBimester = 'b4';
      } 
      // B) Se for ocorrência única, tentamos detectar pelo cabeçalho (Lookbehind)
      else {
        // Tenta achar "Xº Bimestre" DENTRO da seção (prioridade máxima)
        if (/1[ºo°]?\s*bimestre/.test(match.sectionText)) detectedBimester = 'b1';
        else if (/2[ºo°]?\s*bimestre/.test(match.sectionText)) detectedBimester = 'b2';
        else if (/3[ºo°]?\s*bimestre/.test(match.sectionText)) detectedBimester = 'b3';
        else if (/4[ºo°]?\s*bimestre/.test(match.sectionText)) detectedBimester = 'b4';
        
        // Se não achou dentro, olha para TRÁS no texto geral
        if (!detectedBimester) {
            const textBefore = cleanText.slice(0, match.startIndex);
            const lastB1 = textBefore.lastIndexOf('1º bimestre');
            const lastB2 = textBefore.lastIndexOf('2º bimestre');
            const lastB3 = textBefore.lastIndexOf('3º bimestre');
            const lastB4 = textBefore.lastIndexOf('4º bimestre');

            const headers = [
                { id: 'b1', idx: lastB1 }, 
                { id: 'b2', idx: lastB2 }, 
                { id: 'b3', idx: lastB3 }, 
                { id: 'b4', idx: lastB4 }
            ].sort((a, b) => b.idx - a.idx);

            if (headers[0].idx !== -1) {
                // VERIFICAÇÃO DE MENU:
                // Se os cabeçalhos estão "amontoados" (ex: menu do topo da página), ignorar e assumir B1.
                // Isso previne que o último item do menu (4º Bimestre) seja falsamente detectado como o cabeçalho ativo.
                const minIdx = Math.min(...headers.filter(h => h.idx !== -1).map(h => h.idx));
                const maxIdx = headers[0].idx;
                
                // Se a distância entre o primeiro e o último cabeçalho encontrado for pequena (ex: < 150 chars), é um menu.
                if (maxIdx - minIdx < 150 && headers.filter(h => h.idx !== -1).length > 1) {
                    // Menu detectado. Assumir B1 como padrão seguro para Notas Parciais se o usuário colou apenas o conteúdo ativo.
                    detectedBimester = 'b1'; 
                } else {
                    detectedBimester = headers[0].id as BimesterKey;
                }
            } else {
                // Sem cabeçalhos? Padrão B1.
                detectedBimester = 'b1';
            }
        }
      }
    }

    if (!detectedBimester) return;

    // 5. Extrair Valores da Seção
    const hasDetailedKeywords = /teste\s*mensal|teste\s*bimestral|teste\s*dirigido|avaliação|pontuação/i.test(match.sectionText);

    const findValue = (labelRegex: RegExp): string | null => {
      const matchLabel = labelRegex.exec(match.sectionText);
      if (!matchLabel) return null; 
      
      const textAfterLabel = match.sectionText.slice(matchLabel.index + matchLabel[0].length);

      // Regex atualizado para lidar com "- / 10.00" ou apenas "-"
      const emptyMatch = textAfterLabel.match(/^\s*-\s*\//) || textAfterLabel.match(/^\s*-\s*(\n|$)/);
      if (emptyMatch) {
          return ''; 
      }

      const matchNumber = textAfterLabel.match(/(\d+([.,]\d+)?)/);
      if (matchNumber) {
        return parseFloat(matchNumber[0].replace(',', '.')).toFixed(2);
      }
      return ''; 
    };

    // MODO DETALHADO (TM/TB/TD)
    if (hasDetailedKeywords || forceBimester || matches.length > 1) {
        const tmVal = findValue(/teste\s*mensal/);
        const tbVal = findValue(/teste\s*bimestral/);
        const tdVal = findValue(/teste\s*dirigido|trabalhos/);
        
        // Se achou qualquer valor OU se é um campo vazio explícito (tmVal === ''), salvamos.
        // Verificamos != null pois findValue retorna null se não achar a Label.
        if (tmVal !== null || tbVal !== null || tdVal !== null) {
            result[detectedBimester] = {
                tm: tmVal || result[detectedBimester].tm,
                tb: tbVal || result[detectedBimester].tb,
                td: tdVal || result[detectedBimester].td
            };
            hasAnyData = true;
        }
    } 
    // MODO GERAL (Médias Finais apenas) - fallback
    else {
        const b1Avg = findValue(/1[ºo°]?\s*bimestre/);
        const b2Avg = findValue(/2[ºo°]?\s*bimestre/);
        const b3Avg = findValue(/3[ºo°]?\s*bimestre/);
        const b4Avg = findValue(/4[ºo°]?\s*bimestre/);

        if (b1Avg !== null) { result.b1.tb = b1Avg; hasAnyData = true; }
        if (b2Avg !== null) { result.b2.tb = b2Avg; hasAnyData = true; }
        if (b3Avg !== null) { result.b3.tb = b3Avg; hasAnyData = true; }
        if (b4Avg !== null) { result.b4.tb = b4Avg; hasAnyData = true; }
    }
  });

  return hasAnyData ? result : null;
};

/**
 * Função principal de Importação.
 * Agora aceita um bimester forçado opcional.
 */
export const parseGradesFromText = async (text: string, forceBimester?: BimesterKey | null): Promise<SubjectMap> => {
  const results: SubjectMap = {};
  
  // Itera sobre todas as matérias conhecidas
  for (const subject of KNOWN_SUBJECTS) {
    const scores = localFastParse(text, subject, forceBimester);
    if (scores) {
      results[subject] = scores;
    }
  }
  
  return results;
};
