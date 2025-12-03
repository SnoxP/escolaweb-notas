import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { Sparkles, TrendingUp, Save, Download, MoonStar, SunMedium, BookOpen, ChevronDown, Menu as MenuIcon, ArrowLeft, Eye, List, HelpCircle, School, Lightbulb } from 'lucide-react';
import InputCard from './components/InputCard';
import ImportModal from './components/ImportModal';
import Menu from './components/Menu';
import LandingPage from './components/LandingPage';
import TutorialModal from './components/TutorialModal';
import SuggestionModal from './components/SuggestionModal';
import { YearScores, BimesterAverages, SemesterAverages, BimesterKey, ScoreKey, AIAnalysisResult, BimesterScores, SubjectMap } from './types';
import { analyzeGrades } from './services/geminiService';

const INITIAL_SCORES: YearScores = {
  b1: { tm: '', tb: '', td: '', recuperacao: '', average: '' },
  b2: { tm: '', tb: '', td: '', recuperacao: '', average: '' },
  b3: { tm: '', tb: '', td: '', recuperacao: '', average: '' },
  b4: { tm: '', tb: '', td: '', recuperacao: '', average: '' },
  finalResult: ''
};

// Lista unificada de matérias em ordem alfabética
const SUBJECTS = [
  "Artes",
  "Biologia",   // Unificado (I, II)
  "Educação Física",
  "Espanhol",
  "Filosofia", 
  "Física", 
  "Geografia", 
  "História", 
  "Inglês", 
  "Literatura", 
  "Língua Portuguesa", // Unificado (Gramática, Interpretação)
  "Matemática", // Unificado (I, II, Fundamental)
  "Projeto de Vida",
  "Química", 
  "Redação",
  "Sociologia"
];

export default function App() {
  // --- STATE ---

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_preference');
    return saved !== null ? saved === 'dark' : true;
  });

  const [showLanding, setShowLanding] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');

  // Removido salvamento automático da matéria
  const [subjectName, setSubjectName] = useState('');

  // Removido salvamento automático das notas (DB)
  const [allGrades, setAllGrades] = useState<SubjectMap>({});

  const [bimesterAverages, setBimesterAverages] = useState<BimesterAverages>({
    b1: null, b2: null, b3: null, b4: null
  });

  const [semesterAverages, setSemesterAverages] = useState<SemesterAverages>({
    sem1: null, sem2: null
  });

  const [finalAverage, setFinalAverage] = useState<number | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  // Computed Current Scores based on selected Subject
  const currentScores = useMemo(() => {
    if (!subjectName) return INITIAL_SCORES;
    return allGrades[subjectName] || INITIAL_SCORES;
  }, [allGrades, subjectName]);


  // --- EFFECTS ---

  useEffect(() => {
    localStorage.setItem('theme_preference', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Calculate Averages for the CURRENT displayed scores
  const calculateAvg = (s: BimesterScores, bimesterId: string): number | null => {
    const parseScore = (val: string | undefined) => {
      if (!val) return NaN;
      const normalized = val.replace(',', '.');
      return parseFloat(normalized);
    };

    const tm = parseScore(s.tm);
    const tb = parseScore(s.tb);
    const td = parseScore(s.td);
    
    // Check if partial notes exist
    const partialValues = [tm, tb, td].filter(v => !isNaN(v));
    
    if (partialValues.length > 0) {
        // PRIORIDADE 1: Se existirem notas parciais (TM, TB, TD), calcula a média delas
        return partialValues.reduce((acc, curr) => acc + curr, 0) / partialValues.length;
    } else {
        // PRIORIDADE 2: Se não houver notas parciais, usa a Média Geral (Importada ou Manual)
        const generalAvg = parseScore(s.average);
        return isNaN(generalAvg) ? null : generalAvg;
    }
  };

  useEffect(() => {
    const b1 = calculateAvg(currentScores.b1, 'b1');
    const b2 = calculateAvg(currentScores.b2, 'b2');
    const b3 = calculateAvg(currentScores.b3, 'b3');
    const b4 = calculateAvg(currentScores.b4, 'b4');

    setBimesterAverages({ b1, b2, b3, b4 });

    // Helper para parsear notas de recuperação
    const parseRec = (val: string | undefined) => {
      if (!val) return 0;
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    };

    // --- Calculate Semester 1 Average ---
    // Regra: ((Média(B1, B2)) + (Recuperação / 4))
    // 1. Calcula a média dos bimestres
    let sem1 = null;
    const validB1B2 = [b1, b2].filter(v => v !== null) as number[];
    
    if (validB1B2.length > 0) {
      const rawAvg = validB1B2.reduce((a, b) => a + b, 0) / validB1B2.length;
      
      // 2. Adiciona o bônus da recuperação (Nota / 4) à média do semestre
      const rec1 = parseRec(currentScores.b2.recuperacao);
      const bonus1 = rec1 / 4;
      
      sem1 = Math.min(10, rawAvg + bonus1);
    }

    // --- Calculate Semester 2 Average ---
    // Regra: ((Média(B3, B4)) + (Recuperação / 4))
    let sem2 = null;
    const validB3B4 = [b3, b4].filter(v => v !== null) as number[];
    
    if (validB3B4.length > 0) {
      const rawAvg = validB3B4.reduce((a, b) => a + b, 0) / validB3B4.length;
      
      // 2. Adiciona o bônus da recuperação (Nota / 4) à média do semestre
      const rec2 = parseRec(currentScores.b4.recuperacao);
      const bonus2 = rec2 / 4;
      
      sem2 = Math.min(10, rawAvg + bonus2);
    }

    setSemesterAverages({ sem1, sem2 });

    // Final Average: Average of the two semesters
    // Regra: (Sem1 + Sem2) / 2
    const validSems = [sem1, sem2].filter(v => v !== null) as number[];
    if (validSems.length > 0) {
      setFinalAverage(validSems.reduce((a, b) => a + b, 0) / validSems.length);
    } else {
      setFinalAverage(null);
    }
    
    setAiResult(null);

  }, [currentScores]);


  // --- HANDLERS ---

  const handleScoreChange = useCallback((bimester: BimesterKey, field: ScoreKey, value: string) => {
    if (!subjectName) {
      alert("Por favor, selecione uma matéria primeiro.");
      return;
    }

    setAllGrades(prev => ({
      ...prev,
      [subjectName]: {
        ...(prev[subjectName] || INITIAL_SCORES),
        [bimester]: {
          ...(prev[subjectName]?.[bimester] || INITIAL_SCORES[bimester]),
          [field]: value
        }
      }
    }));
  }, [subjectName]);

  const handleAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiResult(null);
    const result = await analyzeGrades(currentScores, bimesterAverages, finalAverage);
    setAiResult(result);
    setIsAiLoading(false);
  };

  const handleImportData = (importedMap: SubjectMap) => {
    setAllGrades(prev => {
      const nextState = { ...prev };
      Object.keys(importedMap).forEach(subject => {
        const newScores = importedMap[subject];
        const oldScores = prev[subject] || INITIAL_SCORES;

        nextState[subject] = {
          b1: {
            ...oldScores.b1, ...newScores.b1
          },
          b2: {
            ...oldScores.b2, ...newScores.b2
          },
          b3: {
            ...oldScores.b3, ...newScores.b3
          },
          b4: {
            ...oldScores.b4, ...newScores.b4
          },
          finalResult: newScores.finalResult || oldScores.finalResult
        };
      });
      return nextState;
    });
    
    const count = Object.keys(importedMap).length;
    alert(`${count} matérias foram atualizadas/mescladas com sucesso!`);
    
    if (!subjectName && count > 0) {
      setSubjectName(Object.keys(importedMap)[0]);
    }
  };

  const clearData = () => {
    if(window.confirm("Isso apagará TODAS as notas de TODAS as matérias. Tem certeza?")) {
      setAllGrades({});
      setAiResult(null);
      setSubjectName('');
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const toggleViewMode = () => setViewMode(prev => prev === 'simple' ? 'detailed' : 'simple');

  // Handlers for Landing Page
  const handleEnterApp = () => {
    setViewMode('simple'); // Default to simple view for General Results
    setShowLanding(false);
    setTimeout(() => setIsImportModalOpen(true), 100);
  }
  
  const handleEnterPartialImport = () => {
      setViewMode('detailed'); // Switch to detailed view for Partial Import
      setShowLanding(false);
      setTimeout(() => setIsImportModalOpen(true), 100);
  }

  // Chart Data
  const chartData = [
    { name: '1º Bi', grade: bimesterAverages.b1 ? parseFloat(bimesterAverages.b1.toFixed(1)) : 0 },
    { name: '2º Bi', grade: bimesterAverages.b2 ? parseFloat(bimesterAverages.b2.toFixed(1)) : 0 },
    { name: '3º Bi', grade: bimesterAverages.b3 ? parseFloat(bimesterAverages.b3.toFixed(1)) : 0 },
    { name: '4º Bi', grade: bimesterAverages.b4 ? parseFloat(bimesterAverages.b4.toFixed(1)) : 0 },
  ];

  const PASSING_GRADE = 7.0;

  // Calcula a soma dos pontos faltantes (Déficit) para o Resumo Anual.
  const totalBimesterDeficit = useMemo(() => {
    const bimesters = [bimesterAverages.b1, bimesterAverages.b2, bimesterAverages.b3, bimesterAverages.b4];
    return bimesters.reduce((acc, avg) => {
        if (avg !== null) {
            return acc + ((PASSING_GRADE - avg) * 3);
        }
        return acc;
    }, 0);
  }, [bimesterAverages]);

  // Status Logic
  const getSystemStatus = () => {
    // FIX: Iterate explicitly over bimesters
    const bimesters = [currentScores.b1, currentScores.b2, currentScores.b3, currentScores.b4];
    
    const hasAnyInput = bimesters.some(b => 
      (b.tm || '').trim() !== '' || (b.tb || '').trim() !== '' || (b.td || '').trim() !== '' || (b.average || '').trim() !== ''
    );
    
    const hasAnyValidAverage = 
      bimesterAverages.b1 !== null || 
      bimesterAverages.b2 !== null || 
      bimesterAverages.b3 !== null || 
      bimesterAverages.b4 !== null;

    if (!hasAnyInput) return { color: 'bg-red-500 shadow-red-500/50', text: 'Não aplicado notas' };
    if (hasAnyInput && !hasAnyValidAverage) return { color: 'bg-yellow-500 shadow-yellow-500/50', text: 'Erro' };
    return { color: 'bg-green-500 shadow-green-500/50', text: 'Aplicado nota' };
  };

  const status = getSystemStatus();

  if (showLanding) {
    return (
      <LandingPage 
        onEnterApp={handleEnterApp} 
        onPartialImportClick={handleEnterPartialImport}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex flex-col items-center py-8 px-4 sm:px-6">
        
        <ImportModal 
          isOpen={isImportModalOpen} 
          onClose={() => setIsImportModalOpen(false)} 
          onImport={handleImportData} 
        />

        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
        />

        <SuggestionModal
          isOpen={isSuggestionOpen}
          onClose={() => setIsSuggestionOpen(false)}
        />

        <Menu 
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onImport={() => setIsImportModalOpen(true)}
          onClear={clearData}
          onAiAnalysis={handleAiAnalysis}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenSuggestion={() => setIsSuggestionOpen(true)}
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          toggleViewMode={toggleViewMode}
          viewMode={viewMode}
        />

        {/* Header */}
        <header className="w-full max-w-5xl mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowLanding(true)}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white text-slate-500 hover:text-slate-900 shadow-sm'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <span className="bg-blue-600 text-white p-2 rounded-xl hidden sm:block">
                  <TrendingUp size={24} />
                </span>
                Notas da Escolaweb
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Unified Desktop & Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`p-2 rounded-lg border transition-colors ${
                 isDarkMode 
                 ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                 : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Menu Principal"
            >
              <MenuIcon size={24} />
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Subject Selector */}
            <div className={`p-4 rounded-2xl border shadow-sm flex items-center gap-3 relative ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <BookOpen className={`flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} size={20} />
              
              <div className="relative w-full">
                <select
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className={`w-full bg-transparent border-none focus:ring-0 text-lg font-semibold outline-none appearance-none cursor-pointer py-1 pr-8 ${
                    isDarkMode 
                      ? 'text-slate-100' 
                      : 'text-slate-800'
                  } ${!subjectName && (isDarkMode ? 'text-slate-500' : 'text-slate-400 font-normal')}`}
                >
                  <option value="" disabled className={isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-400'}>
                    Selecione a Matéria
                  </option>
                  {SUBJECTS.map((sub) => (
                    <option 
                      key={sub} 
                      value={sub} 
                      className={isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}
                    >
                      {sub}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                   <ChevronDown className={`h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputCard 
                id="b1" 
                title="1º Bimestre" 
                data={currentScores.b1} 
                average={bimesterAverages.b1} 
                onChange={handleScoreChange} 
                viewMode={viewMode}
              />
              <InputCard 
                id="b2" 
                title="2º Bimestre" 
                data={currentScores.b2} 
                average={bimesterAverages.b2} 
                onChange={handleScoreChange} 
                viewMode={viewMode}
              />
              <InputCard 
                id="b3" 
                title="3º Bimestre" 
                data={currentScores.b3} 
                average={bimesterAverages.b3} 
                onChange={handleScoreChange} 
                viewMode={viewMode}
              />
              <InputCard 
                id="b4" 
                title="4º Bimestre" 
                data={currentScores.b4} 
                average={bimesterAverages.b4} 
                onChange={handleScoreChange} 
                viewMode={viewMode}
              />
            </div>

            {aiResult && (
              <div className={`p-6 rounded-2xl border animate-fade-in ${
                aiResult.status === 'error' 
                  ? (isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200') 
                  : (isDarkMode ? 'bg-indigo-950/40 border-indigo-900' : 'bg-indigo-50 border-indigo-200')
              }`}>
                <h3 className={`flex items-center gap-2 font-bold text-lg mb-3 ${
                  isDarkMode ? 'text-indigo-300' : 'text-indigo-900'
                }`}>
                  <Sparkles className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} size={20} />
                  Insights da IA
                </h3>
                <p className={`mb-4 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {aiResult.message}
                </p>
                {aiResult.actionableTips.length > 0 && (
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-white/60'}`}>
                    <h4 className={`font-semibold text-sm uppercase tracking-wide mb-2 ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-800'
                    }`}>
                      Dicas de Estudo
                    </h4>
                    <ul className="space-y-2">
                      {aiResult.actionableTips.map((tip, idx) => (
                        <li key={idx} className={`flex items-start gap-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span className="mt-1 block min-w-[6px] h-[6px] rounded-full bg-indigo-500"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="sticky top-6 space-y-4">
              <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className={`font-bold text-xl mb-6 flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <Save size={20} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                  Resumo Anual
                </h2>

                <div className="space-y-6">
                  <div className={`flex justify-between items-center pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Média 1º Semestre</p>
                      <p className="text-xs text-slate-500">(1º e 2º Bimestres)</p>
                    </div>
                    <div className={`text-xl font-bold ${
                      semesterAverages.sem1 === null ? 'text-slate-500' : 
                      semesterAverages.sem1 >= PASSING_GRADE ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {semesterAverages.sem1 ? semesterAverages.sem1.toFixed(1) : '-'}
                    </div>
                  </div>

                  <div className={`flex justify-between items-center pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Média 2º Semestre</p>
                      <p className="text-xs text-slate-500">(3º e 4º Bimestres)</p>
                    </div>
                    <div className={`text-xl font-bold ${
                      semesterAverages.sem2 === null ? 'text-slate-500' : 
                      semesterAverages.sem2 >= PASSING_GRADE ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {semesterAverages.sem2 ? semesterAverages.sem2.toFixed(1) : '-'}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Média Final</p>
                      {finalAverage !== null && (
                        <span className={`text-xs px-2 py-1 rounded-md font-bold ${
                          finalAverage >= PASSING_GRADE 
                            ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                            : (isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                        }`}>
                          {finalAverage >= PASSING_GRADE ? 'Aprovado' : 'Reprovado'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center">
                       <span className={`text-4xl font-extrabold ${
                          finalAverage === null ? 'text-slate-300 dark:text-slate-700' :
                          finalAverage >= PASSING_GRADE ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                       }`}>
                          {finalAverage !== null ? finalAverage.toFixed(1) : '-'}
                       </span>

                       {/* Nota Oficial da Escola (Importada) - AGORA COM CONTRASTE */}
                       {currentScores.finalResult && (
                         <div className="mt-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 rounded-full border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                           <School size={12} />
                           Escola: {currentScores.finalResult}
                         </div>
                       )}

                       {/* Total de Pontos Calculado */}
                       {finalAverage !== null && (
                         <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 font-medium">
                           Total: {(finalAverage * 4).toFixed(0)} pts
                         </span>
                       )}
                       
                       <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full my-3"></div>

                       <p className={`text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Mínimo para passar: {PASSING_GRADE.toFixed(1)}
                       </p>

                       {/* Pontos Faltantes (Final) */}
                       {finalAverage !== null && finalAverage < PASSING_GRADE && (
                         <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/30 flex flex-col gap-1 w-full">
                           <p className="text-sm font-bold text-red-600 dark:text-red-400 text-center">
                             Precisa tirar {(10 - finalAverage).toFixed(1)} na Prova Final
                           </p>
                           <p className="text-[10px] text-red-500 dark:text-red-400/80 text-center uppercase tracking-wide font-semibold">
                             Déficit Anual: {totalBimesterDeficit.toFixed(1)} pts
                           </p>
                         </div>
                       )}

                       {/* Pontos Sobrando (Final) */}
                       {finalAverage !== null && finalAverage >= PASSING_GRADE && (
                         <div className="mt-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                           <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center">
                             Sobram {((finalAverage - PASSING_GRADE) * 4).toFixed(1)} pontos escolares
                           </p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Legend */}
              <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                 isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                 <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] ${status.color}`}></div>
                 <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {status.text}
                 </span>
              </div>

              {/* Chart */}
              <div className={`p-6 rounded-2xl shadow-sm border h-80 transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className={`font-bold text-sm uppercase tracking-wide mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Evolução
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                     <YAxis 
                      domain={[0, 10]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                      width={20}
                    />
                    <Tooltip 
                      cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#0f172a' : '#fff', 
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <ReferenceLine y={PASSING_GRADE} stroke="#ef4444" strokeDasharray="3 3" />
                    <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.grade < 5 ? '#ef4444' : // Red
                            entry.grade < 7 ? '#eab308' : // Yellow
                            '#22c55e' // Green
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}