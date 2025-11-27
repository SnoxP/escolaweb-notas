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
import { Sparkles, TrendingUp, Save, Download, MoonStar, SunMedium, BookOpen, ChevronDown } from 'lucide-react';
import InputCard from './components/InputCard';
import ImportModal from './components/ImportModal';
import { YearScores, BimesterAverages, SemesterAverages, BimesterKey, ScoreKey, AIAnalysisResult, BimesterScores, SubjectMap } from './types';
import { analyzeGrades } from './services/geminiService';

const INITIAL_SCORES: YearScores = {
  b1: { tm: '', tb: '', td: '' },
  b2: { tm: '', tb: '', td: '' },
  b3: { tm: '', tb: '', td: '' },
  b4: { tm: '', tb: '', td: '' },
};

const SUBJECTS = [
  "Filosofia", 
  "Geografia", 
  "Artes", 
  "Química", 
  "Inglês", 
  "Física", 
  "Matemática", 
  "Biologia", 
  "História", 
  "Literatura", 
  "Gramática", 
  "Interpretação de Texto",
  "Educação Física",
  "Redação",
  "Sociologia",
  "Espanhol",
  "Projeto de Vida"
];

export default function App() {
  // --- STATE ---

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_preference');
    return saved !== null ? saved === 'dark' : true;
  });

  const [subjectName, setSubjectName] = useState(() => {
    return localStorage.getItem('subject_name') || '';
  });

  // DB of all grades: Map<SubjectName, Scores>
  const [allGrades, setAllGrades] = useState<SubjectMap>(() => {
    const saved = localStorage.getItem('school_grades_db');
    if (saved) return JSON.parse(saved);
    
    // Migration/Legacy fallback: check if old single-subject data exists
    const legacy = localStorage.getItem('school_grades');
    if (legacy) {
      // If we have legacy data, we don't know which subject it belongs to.
      // We can start clean or assign to 'Unknown'. Starting clean is safer for the new structure.
      return {}; 
    }
    return {};
  });

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

  useEffect(() => {
    localStorage.setItem('subject_name', subjectName);
  }, [subjectName]);

  // Save entire DB whenever it changes
  useEffect(() => {
    localStorage.setItem('school_grades_db', JSON.stringify(allGrades));
  }, [allGrades]);


  // Calculate Averages for the CURRENT displayed scores
  const calculateAvg = (s: { tm: string, tb: string, td: string }): number | null => {
    const parseScore = (val: string) => {
      if (!val) return NaN;
      const normalized = val.replace(',', '.');
      return parseFloat(normalized);
    };

    const tm = parseScore(s.tm);
    const tb = parseScore(s.tb);
    const td = parseScore(s.td);
    
    const values = [tm, tb, td].filter(v => !isNaN(v));
    
    if (values.length === 0) return null;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return sum / values.length;
  };

  useEffect(() => {
    // Recalculate whenever currentScores changes (either by editing or switching subject)
    const b1 = calculateAvg(currentScores.b1);
    const b2 = calculateAvg(currentScores.b2);
    const b3 = calculateAvg(currentScores.b3);
    const b4 = calculateAvg(currentScores.b4);

    setBimesterAverages({ b1, b2, b3, b4 });

    setSemesterAverages({ 
      sem1: (b1 !== null && b2 !== null) ? (b1 + b2) / 2 : null,
      sem2: (b3 !== null && b4 !== null) ? (b3 + b4) / 2 : null
    });

    const validBimesters = [b1, b2, b3, b4].filter(v => v !== null) as number[];
    if (validBimesters.length > 0) {
      setFinalAverage(validBimesters.reduce((a, b) => a + b, 0) / validBimesters.length);
    } else {
      setFinalAverage(null);
    }
    
    // Clear AI result when switching subjects or editing
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
    // Merge imported grades with existing ones
    setAllGrades(prev => ({
      ...prev,
      ...importedMap
    }));
    
    const count = Object.keys(importedMap).length;
    alert(`${count} matérias foram atualizadas com sucesso!`);
    
    // If user hasn't selected a subject yet, auto-select the first imported one
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

  // Chart Data
  const chartData = [
    { name: '1º Bi', grade: bimesterAverages.b1 ? parseFloat(bimesterAverages.b1.toFixed(1)) : 0 },
    { name: '2º Bi', grade: bimesterAverages.b2 ? parseFloat(bimesterAverages.b2.toFixed(1)) : 0 },
    { name: '3º Bi', grade: bimesterAverages.b3 ? parseFloat(bimesterAverages.b3.toFixed(1)) : 0 },
    { name: '4º Bi', grade: bimesterAverages.b4 ? parseFloat(bimesterAverages.b4.toFixed(1)) : 0 },
  ];

  const PASSING_GRADE = 7.0;

  // Status Logic
  const getSystemStatus = () => {
    const hasAnyInput = (Object.values(currentScores) as BimesterScores[]).some(b => 
      b.tm.trim() !== '' || b.tb.trim() !== '' || b.td.trim() !== ''
    );

    const hasAnyValidAverage = 
      bimesterAverages.b1 !== null || 
      bimesterAverages.b2 !== null || 
      bimesterAverages.b3 !== null || 
      bimesterAverages.b4 !== null;

    if (!hasAnyInput) {
      return { color: 'bg-red-500 shadow-red-500/50', text: 'Não aplicado notas' };
    }

    if (hasAnyInput && !hasAnyValidAverage) {
      return { color: 'bg-yellow-500 shadow-yellow-500/50', text: 'Erro' };
    }

    return { color: 'bg-green-500 shadow-green-500/50', text: 'Aplicado nota' };
  };

  const status = getSystemStatus();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex flex-col items-center py-8 px-4 sm:px-6">
        
        <ImportModal 
          isOpen={isImportModalOpen} 
          onClose={() => setIsImportModalOpen(false)} 
          onImport={handleImportData} 
        />

        {/* Header */}
        <header className="w-full max-w-5xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="bg-blue-600 text-white p-2 rounded-xl">
                <TrendingUp size={24} />
              </span>
              Notas da Escolaweb
            </h1>
            <p className={`mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Calcule suas médias bimestrais e anuais (TM, TB e TD)
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
             <button
               onClick={toggleTheme}
               className={`p-2 rounded-lg border transition-colors ${
                 isDarkMode 
                   ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' 
                   : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
               }`}
               aria-label="Alternar tema"
             >
               {isDarkMode ? <MoonStar size={20} /> : <SunMedium size={20} />}
             </button>

             <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>

             <button 
              onClick={clearData}
              className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                  : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
              }`}
             >
               Limpar Tudo
             </button>
             <button 
              onClick={() => setIsImportModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-blue-400'
                  : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:text-blue-600'
              }`}
             >
               <Download size={16} />
               Importar
             </button>
             <button 
              onClick={handleAiAnalysis}
              disabled={isAiLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100"
             >
               {isAiLoading ? (
                 <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
               ) : (
                 <Sparkles size={16} />
               )}
               {isAiLoading ? 'Analisando...' : 'Dicas IA'}
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
              />
              <InputCard 
                id="b2" 
                title="2º Bimestre" 
                data={currentScores.b2} 
                average={bimesterAverages.b2} 
                onChange={handleScoreChange} 
              />
              <InputCard 
                id="b3" 
                title="3º Bimestre" 
                data={currentScores.b3} 
                average={bimesterAverages.b3} 
                onChange={handleScoreChange} 
              />
              <InputCard 
                id="b4" 
                title="4º Bimestre" 
                data={currentScores.b4} 
                average={bimesterAverages.b4} 
                onChange={handleScoreChange} 
              />
            </div>

            {/* AI Feedback Section */}
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

          {/* Right Column: Results & Charts */}
          <div className="space-y-6">
            
            <div className="sticky top-6 space-y-4">
              {/* Summary Card */}
              <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className={`font-bold text-xl mb-6 flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <Save size={20} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                  Resumo Anual
                </h2>

                <div className="space-y-6">
                  {/* Semester 1 */}
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

                  {/* Semester 2 */}
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

                  {/* Final Average */}
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Média Final</p>
                      {finalAverage !== null && (
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          finalAverage >= PASSING_GRADE 
                            ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') 
                            : (isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                        }`}>
                          {finalAverage >= PASSING_GRADE ? 'APROVADO' : 'RECUPERAÇÃO'}
                        </span>
                      )}
                    </div>
                    <div className="text-center py-2">
                      <span className={`text-5xl font-extrabold ${
                        finalAverage === null ? 'text-slate-600' : 
                        finalAverage >= PASSING_GRADE ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {finalAverage ? finalAverage.toFixed(1) : '-'}
                      </span>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-1">Mínimo para passar: {PASSING_GRADE.toFixed(1)}</p>
                  </div>
                </div>

                {/* Visual Chart */}
                <div className="mt-8 h-48 w-full">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Evolução</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                        width={25}
                      />
                      <Tooltip 
                        cursor={{fill: isDarkMode ? '#1e293b' : '#f1f5f9'}}
                        contentStyle={{
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                          color: isDarkMode ? '#f8fafc' : '#0f172a'
                        }} 
                      />
                      <ReferenceLine y={PASSING_GRADE} stroke="#ef4444" strokeDasharray="3 3" />
                      <Bar dataKey="grade" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => {
                          let fillColor;
                          if (entry.grade < 5) {
                            fillColor = '#ef4444'; // Red for < 5
                          } else if (entry.grade < 7) {
                            fillColor = '#eab308'; // Yellow for 5 <= grade < 7
                          } else {
                            fillColor = '#22c55e'; // Green for >= 7
                          }
                          return <Cell key={`cell-${index}`} fill={fillColor} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend Card - Dynamic Status */}
              <div className={`px-6 py-4 rounded-2xl border transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                 <h3 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                   Status
                 </h3>
                 <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {status.text}
                    </span>
                 </div>
              </div>
            </div>
            
          </div>
        </main>

        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>Calculadora baseada no sistema TM, TB e TD.</p>
          <p className="mt-1">© 2024</p>
        </footer>
      </div>
    </div>
  );
}