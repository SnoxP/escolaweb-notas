import { GoogleGenAI } from "@google/genai";
import { YearScores, BimesterAverages, AIAnalysisResult, SubjectMap, BimesterKey } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize purely if key exists to avoid immediate crash, handle check later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// List of subjects to scan for during bulk import
// ATENÇÃO: Esta lista deve estar sincronizada com a do App.tsx
// Nomes Unificados
const KNOWN_SUBJECTS = [
  "Filosofia", "Geografia", "Artes", "Química", "Inglês", "Física",
  "Matemática", // Unificado
  "Biologia",   // Unificado
  "História", "Literatura", 
  "Língua Portuguesa", // Unificado
  "Educação Física", "Redação", "Sociologia",
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

  // 2. Definir termos de busca para a matéria (Aliases)
  let searchTerms: string[] = [];
  
  if (normalizedSubject === 'artes') searchTerms.push('arte');
  else if (normalizedSubject === 'ingles') searchTerms.push('lingua inglesa');
  else if (normalizedSubject === 'espanhol') searchTerms.push('lingua espanhola');
  else if (normalizedSubject === 'lingua portuguesa') {
      // Mapeia todas as variantes de Português para uma única matéria
      searchTerms.push('gramatica', 'interpretacao de texto', 'interpretacao de textos', 'lingua portuguesa', 'portugues');
  }
  else if (normalizedSubject === 'matematica') {
      // Mapeia todas as Matemáticas para uma única matéria
      searchTerms.push('matematica i', 'matematica ii', 'matematica fundamental', 'matematica');
  }
  else if (normalizedSubject === 'biologia') {
      // Mapeia todas as Biologias para uma única matéria
      searchTerms.push('biologia i', 'biologia ii', 'biologia');
  }
  
  // Se não for um caso especial, usa o próprio nome
  if (searchTerms.length === 0) {
      searchTerms.push(normalizedSubject);
  }
  
  // Lista de todas as matérias (incluindo as antigas) para servir de "Stop Words"
  const allSubjects = [
    "arte", "biologia", "biologia i", "biologia ii", 
    "educacao fisica", "filosofia", "fisica", 
    "geografia", "historia", "literatura", 
    "lingua espanhola", "lingua inglesa", "lingua portuguesa", 
    "matematica", "matematica i", "matematica ii", "matematica fundamental",
    "projeto de vida", "quimica", "redacao", "sociologia",
    "interpretacao de textos", "gramatica"
  ];

  // Estrutura de resultado acumulativo
  const result: YearScores = {
    b1: { tm: '', tb: '', td: '', recuperacao: '', average: '' },
    b2: { tm: '', tb: '', td: '', recuperacao: '', average: '' },
    b3: { tm: '', tb: '', td: '', recuperacao: '', average: '' },
    b4: { tm: '', tb: '', td: '', recuperacao: '', average: '' },
    finalResult: ''
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
      
      // Tratamento de colisão e falso positivos
      while (pos !== -1) {
        const isPartOfEducation = term === 'fisica' && 
          cleanText.substring(Math.max(0, pos - 15), pos).includes('educacao');
        
        const charAfter = cleanText[pos + term.length];
        const isSubstring = charAfter && /[a-z0-9]/i.test(charAfter);

        if (!isPartOfEducation && !isSubstring) {
          if (bestStartIndex === -1 || pos < bestStartIndex) {
            bestStartIndex = pos;
            foundTermLength = term.length;
          }
          break; // Encontrou um match válido para este termo
        }
        
        // Se foi um falso positivo, continua buscando o mesmo termo mais à frente
        pos = cleanText.indexOf(term, pos + 1);
      }
    }

    if (bestStartIndex === -1) break;

    const sectionStart = bestStartIndex;
    
    // Determinar FIM da seção (início da próxima matéria)
    let sectionEnd = cleanText.length;
    for (const sub of allSubjects) {
      // Ignora a própria matéria se encontrada logo no início
      if (cleanText.substring(sectionStart, sectionStart + foundTermLength + 5).includes(sub)) continue; 
      
      let idx = cleanText.indexOf(sub, sectionStart + foundTermLength);
      
      // Verifica colisão "Educação Física" no stop word "Física"
      if (idx !== -1 && sub === 'fisica') {
         const isFakePhysics = cleanText.substring(Math.max(0, idx - 15), idx).includes('educacao');
         if (isFakePhysics) {
             idx = cleanText.indexOf(sub, idx + 1);
         }
      }

      if (idx !== -1 && idx < sectionEnd) {
        const charAfterStop = cleanText[idx + sub.length];
        const isStopSubstring = charAfterStop && /[a-z0-9]/i.test(charAfterStop);
        
        if (!isStopSubstring) {
            sectionEnd = idx;
        }
      }
    }

    let sectionText = cleanText.slice(sectionStart, sectionEnd);
    
    matches.push({
      sectionText,
      startIndex: sectionStart
    });
    
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
      // PRIORIDADE 1: Buscar cabeçalho EXPLÍCITO dentro do texto da seção
      if (/1[ºo°]?\s*bimestre/.test(match.sectionText)) detectedBimester = 'b1';
      else if (/2[ºo°]?\s*bimestre/.test(match.sectionText)) detectedBimester = 'b2';
      else if (/3[ºo°]?\s*bimestre/.test(match.sectionText)) detectedBimester = 'b3';
      else if (/4[ºo°]?\s*bimestre/.test(match.sectionText)) detectedBimester = 'b4';
      
      // PRIORIDADE 2: Buscar cabeçalho PRÓXIMO (Lookbehind) no texto geral
      if (!detectedBimester) {
          const textBefore = cleanText.slice(0, match.startIndex);
          // Busca os cabeçalhos mais próximos para trás
          const lastB1 = textBefore.lastIndexOf('1º bimestre');
          const lastB2 = textBefore.lastIndexOf('2º bimestre');
          const lastB3 = textBefore.lastIndexOf('3º bimestre');
          const lastB4 = textBefore.lastIndexOf('4º bimestre');

          const headers = [
              { id: 'b1', idx: lastB1 }, 
              { id: 'b2', idx: lastB2 }, 
              { id: 'b3', idx: lastB3 }, 
              { id: 'b4', idx: lastB4 }
          ].filter(h => h.idx !== -1).sort((a, b) => b.idx - a.idx); // Ordena pelo índice maior (mais próximo)

          if (headers.length > 0) {
              const closest = headers[0];
              // Se o cabeçalho estiver a uma distância razoável (ex: < 800 caracteres)
              // isso evita pegar um cabeçalho muito antigo de outra tabela
              if (match.startIndex - closest.idx < 800) {
                  detectedBimester = closest.id as BimesterKey;
              }
          }
      }

      // PRIORIDADE 3: Fallback para Sequência (Apenas se não encontrou nada explícito)
      if (!detectedBimester) {
        if (matches.length > 1) {
            const seqIndex = index % 4; 
            if (seqIndex === 0) detectedBimester = 'b1';
            else if (seqIndex === 1) detectedBimester = 'b2';
            else if (seqIndex === 2) detectedBimester = 'b3';
            else if (seqIndex === 3) detectedBimester = 'b4';
        } else {
            // Se só tem 1 match e nenhum cabeçalho, assume B1
            detectedBimester = 'b1';
        }
      }
    }

    // 5. Extrair Valores
    
    // Função local para buscar valor
    const findValue = (labelRegex: RegExp): string | null => {
      const matchLabel = labelRegex.exec(match.sectionText);
      if (!matchLabel) return null; 
      
      const textAfterLabel = match.sectionText.slice(matchLabel.index + matchLabel[0].length);
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

    // --- Lógica Principal de Extração ---
    
    const hasDetailedKeywords = /teste\s*mensal|teste\s*bimestral|teste\s*dirigido|avaliação|pontuação/i.test(match.sectionText);

    // MODO DETALHADO (TM/TB/TD)
    if (detectedBimester && (hasDetailedKeywords || forceBimester || matches.length > 1)) {
        const tmVal = findValue(/teste\s*mensal/);
        const tbVal = findValue(/teste\s*bimestral/);
        const tdVal = findValue(/teste\s*dirigido|trabalhos/);
        
        if (tmVal !== null || tbVal !== null || tdVal !== null) {
            const currentObj = result[detectedBimester];
            result[detectedBimester] = {
                ...currentObj,
                tm: tmVal !== null ? tmVal : currentObj.tm,
                tb: tbVal !== null ? tbVal : currentObj.tb,
                td: tdVal !== null ? tdVal : currentObj.td
            };
            hasAnyData = true;
        }
    } 
    // MODO GERAL (Médias Finais apenas) - Salva em 'average'
    else {
        // Tenta pegar médias explicitamente listadas no texto
        const b1Avg = findValue(/1[ºo°]?\s*bimestre/);
        const b2Avg = findValue(/2[ºo°]?\s*bimestre/);
        const b3Avg = findValue(/3[ºo°]?\s*bimestre/);
        const b4Avg = findValue(/4[ºo°]?\s*bimestre/);

        // ATENÇÃO: Agora salvamos em 'average' para não misturar com TB de notas parciais
        if (b1Avg !== null) { result.b1.average = b1Avg; hasAnyData = true; }
        if (b2Avg !== null) { result.b2.average = b2Avg; hasAnyData = true; }
        if (b3Avg !== null) { result.b3.average = b3Avg; hasAnyData = true; }
        if (b4Avg !== null) { result.b4.average = b4Avg; hasAnyData = true; }
    }

    // --- LÓGICA DE RECUPERAÇÃO SEMESTRAL (CROSS-BIMESTRE) ---
    // Apenas extrai os valores, não aplica soma no TB aqui. A soma ocorre no App.tsx.
    
    const rec1ValStr = findValue(/rec(?:upera[cç][aã]o)?.*?1[ºo°]?\s*sem(?:estre)?/i);
    if (rec1ValStr && rec1ValStr !== '') {
        result.b2.recuperacao = rec1ValStr;
        hasAnyData = true;
    }

    const rec2ValStr = findValue(/rec(?:upera[cç][aã]o)?.*?2[ºo°]?\s*sem(?:estre)?/i);
    if (rec2ValStr && rec2ValStr !== '') {
        result.b4.recuperacao = rec2ValStr;
        hasAnyData = true;
    }

    // --- LÓGICA DE RESULTADO FINAL (ESCOLA) ---
    
    const finalResRegex = /(?:Resultado|Total|Média Final)[\s\S]*?(\d+(?:[.,]\d+)?)/gi;
    let matchFinal;
    let lastValidFinalResult = null;
    
    finalResRegex.lastIndex = 0;

    while ((matchFinal = finalResRegex.exec(match.sectionText)) !== null) {
        const endOfNumberIndex = finalResRegex.lastIndex;
        const charAfter = match.sectionText[endOfNumberIndex];
        
        if (charAfter === 'º' || charAfter === '°' || charAfter === 'ª') {
            continue;
        }

        const val = parseFloat(matchFinal[1].replace(',', '.'));
        if (!isNaN(val) && val >= 0 && val <= 10) {
            lastValidFinalResult = matchFinal[1].replace(',', '.');
        }
    }

    if (lastValidFinalResult) {
        result.finalResult = parseFloat(lastValidFinalResult).toFixed(2);
    }

  });

  return hasAnyData ? result : null;
};

/**
 * Função principal de Importação.
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