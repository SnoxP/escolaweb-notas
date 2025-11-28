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
  // Isso garante que o parser saiba onde parar mesmo se encontrar um nome antigo
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
      
      // Tratamento de colisão e falso positivos
      while (pos !== -1) {
        
        // Check 1: "Educação Física" vs "Física"
        const isPartOfEducation = term === 'fisica' && 
          cleanText.substring(Math.max(0, pos - 15), pos).includes('educacao');
        
        // Check 2: Word Boundary (Crucial para "Matemática I" vs "Matemática II")
        // Verifica se o caractere APÓS o termo é uma letra ou número, o que indicaria que o termo continua
        // Mas se estivermos procurando por "Matematica" (genérico) e acharmos "Matematica I", devemos aceitar?
        // A lógica de searchTerms coloca os mais específicos (I, II) também na lista se necessário.
        // Se a busca for "Matematica" e acharmos "Matematica", ok.
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
      // Ignora a própria matéria se encontrada logo no início (ex: título repetido)
      if (cleanText.substring(sectionStart, sectionStart + foundTermLength + 5).includes(sub)) continue; 
      
      let idx = cleanText.indexOf(sub, sectionStart + foundTermLength);
      
      // Verifica colisão "Educação Física" no stop word "Física"
      if (idx !== -1 && sub === 'fisica') {
         const isFakePhysics = cleanText.substring(Math.max(0, idx - 15), idx).includes('educacao');
         if (isFakePhysics) {
             // Tenta achar a próxima "Física" real
             idx = cleanText.indexOf(sub, idx + 1);
         }
      }

      if (idx !== -1 && idx < sectionEnd) {
        // Verifica boundary também para o stop word
        const charAfterStop = cleanText[idx + sub.length];
        const isStopSubstring = charAfterStop && /[a-z0-9]/i.test(charAfterStop);
        
        if (!isStopSubstring) {
            sectionEnd = idx;
        }
      }
    }

    let sectionText = cleanText.slice(sectionStart, sectionEnd);
    // Limpeza extra para evitar pegar cabeçalhos repetidos de forma errada
    sectionText = sectionText.replace(/total\s*.*semestre.*(\n|$)/g, " ");
    
    matches.push({
      sectionText,
      startIndex: sectionStart
    });
    
    // Atualiza ponteiro para buscar próxima ocorrência
    // Se achamos "Matemática I", avançamos. A próxima pode ser "Matemática II" (se estivermos unificando).
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
      
      // A) Se tivermos múltiplas ocorrências VÁLIDAS, assumimos SEQUÊNCIA
      // OBS: Se unificamos "Mat I" e "Mat II", podemos ter 8 ocorrências se o cara colou tudo.
      // Nesse caso, o código vai tentar preencher B1..B4 repetidamente.
      // Como o objeto `result` é acumulativo, a segunda ocorrência de B1 vai sobrescrever a primeira.
      // Isso é o comportamento desejado se quisermos apenas "uma" nota (a última válida encontrada).
      if (matches.length > 1) {
        // Usa módulo para lidar com múltiplas matérias unificadas (ex: Mat I 4 bims + Mat II 4 bims = 8 itens)
        const seqIndex = index % 4; 
        if (seqIndex === 0) detectedBimester = 'b1';
        else if (seqIndex === 1) detectedBimester = 'b2';
        else if (seqIndex === 2) detectedBimester = 'b3';
        else if (seqIndex === 3) detectedBimester = 'b4';
      } 
      // B) Ocorrência única: Tenta detectar pelo cabeçalho
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
            ].sort((a, b) => b.idx - a.idx); // O maior índice é o mais próximo (header imediatamente acima)

            if (headers[0].idx !== -1) {
                // VERIFICAÇÃO DE MENU:
                // Se detectar que existe um menu "1º...4º" compactado logo acima, e o usuário NÃO forçou um bimestre,
                // assumimos B1 (aba ativa padrão) para evitar detectar B4 erroneamente do menu.
                const validHeaders = headers.filter(h => h.idx !== -1);
                if (validHeaders.length > 1) {
                    const minIdx = Math.min(...validHeaders.map(h => h.idx));
                    const maxIdx = Math.max(...validHeaders.map(h => h.idx));
                    
                    // Se todos os headers estão num bloco pequeno (< 200 chars), é um menu
                    if (maxIdx - minIdx < 200) {
                         detectedBimester = 'b1'; // Fallback seguro
                    } else {
                        detectedBimester = headers[0].id as BimesterKey;
                    }
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

      // Regex para lidar com "- / 10.00" ou apenas "-"
      // Verifica explicitamente se começa com traço seguido de barra ou quebra de linha
      const emptyMatch = textAfterLabel.match(/^\s*-\s*\//) || textAfterLabel.match(/^\s*-\s*(\n|$)/);
      if (emptyMatch) {
          return ''; 
      }

      // Busca número (ex: 9.00)
      const matchNumber = textAfterLabel.match(/(\d+([.,]\d+)?)/);
      if (matchNumber) {
        return parseFloat(matchNumber[0].replace(',', '.')).toFixed(2);
      }
      return ''; 
    };

    // MODO DETALHADO (TM/TB/TD)
    // Se forçado, ou se for sequência, ou se tiver keywords detalhadas
    if (hasDetailedKeywords || forceBimester || matches.length > 1) {
        const tmVal = findValue(/teste\s*mensal/);
        const tbVal = findValue(/teste\s*bimestral/);
        const tdVal = findValue(/teste\s*dirigido|trabalhos/);
        
        // Se achou qualquer valor OU se identificou campo vazio (''), salvamos.
        // Se já existe valor (de uma Matéria anterior unificada ex: Mat I), só sobrescreve se o novo for válido (não nulo)
        if (tmVal !== null || tbVal !== null || tdVal !== null) {
            result[detectedBimester] = {
                tm: tmVal !== null ? tmVal : result[detectedBimester].tm,
                tb: tbVal !== null ? tbVal : result[detectedBimester].tb,
                td: tdVal !== null ? tdVal : result[detectedBimester].td
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