import React, { useState, useEffect } from 'react';
import { Calculator, ExternalLink, ChevronRight, FileText, History, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onPartialImportClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onPartialImportClick }) => {
  
  // Função para calcular tempo relativo
  const getRelativeTime = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`; // até 7 dias
    
    // Se for mais antigo, retorna a data formatada
    return date.toLocaleDateString('pt-BR');
  };

  // State para forçar atualização do tempo relativo a cada minuto (opcional, para manter o "Agora" vivo)
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Constante para um dia em milissegundos
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const changelog = [
    {
      version: '2.06',
      date: new Date(), // Agora
      changes: [
        'Refinamento completo da lógica de cálculo (Médias Semestrais e Final).',
        'Visualização da "Nota Oficial da Escola" e Total de Pontos importados.',
        'Correções críticas de estabilidade e melhorias na detecção de notas.'
      ]
    },
    {
      version: '2.05',
      date: new Date(Date.now() - ONE_DAY_MS * 0.1), // Hoje, um pouco antes
      changes: [
        'Ajuste no Déficit Anual: Notas acima da média agora abatem a dívida de pontos.',
        'Refinamentos na interface de cálculo final.'
      ]
    },
    {
      version: '2.04',
      date: new Date(Date.now() - ONE_DAY_MS * 1), // Ontem
      changes: [
        'Cálculo de Prova Final: Exibe nota necessária + pontos faltantes.',
        'Ajuste na interface de Resultados Finais.'
      ]
    },
    {
      version: '2.03',
      date: new Date(Date.now() - ONE_DAY_MS * 1.2), // Ontem
      changes: [
        'Correção no cálculo da Prova Final (Pontos Faltantes).',
        'Melhoria na detecção de Recuperação Semestral.',
      ]
    },
    {
      version: '2.02',
      date: new Date(Date.now() - ONE_DAY_MS * 2), // Anteontem
      changes: [
        'Cálculo de Recuperação Semestral (Nota/4) integrado.',
        'Visualização da nota de recuperação no rodapé do card.',
        'Correção de bugs na importação de bimestres.'
      ]
    },
    {
      version: '2.01',
      date: new Date(Date.now() - ONE_DAY_MS * 2.2), // Anteontem
      changes: [
        'Unificação de matérias (Matemática I/II → Matemática).',
        'Novo Tutorial interativo de uso.',
        'Integração com Google Analytics.'
      ]
    },
    {
      version: '2.00',
      date: new Date(Date.now() - ONE_DAY_MS * 3), // 3 dias atrás
      changes: [
        'Novo Design System (Dark/Light Mode).',
        'Integração com IA Gemini para dicas de estudo.',
        'Importação inteligente de texto.'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      <div className="w-full max-w-lg space-y-8 animate-fade-in flex flex-col items-center my-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 w-full">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="https://play-lh.googleusercontent.com/sLit3rYFhvsvIB1TjnXzPM44AfpP6-z-5CH8MFNn2IL_4fNzs3PN0pTHPnmI8Q2qiQ" 
              alt="EscolaWeb Logo" 
              className="w-24 h-24 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 rounded-2xl" 
            />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notas da Escolaweb
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Gerencie suas notas bimestrais, calcule médias e receba dicas de estudo com Inteligência Artificial.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-4 mt-8 w-full">
          
          <button 
            onClick={onPartialImportClick}
            className="group relative flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 text-left w-full"
          >
             <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Notas Parciais</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Importar TM, TB e TD por bimestre</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
          </button>

          <button 
            onClick={onEnterApp}
            className="group relative flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 text-left w-full"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calculator size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Resultados Gerais</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Importar ou visualizar médias</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
          </button>

        </div>

        {/* Footer Link */}
        <div className="pt-2 text-center">
          <a 
            href="https://cmachado.escolaweb.com.br/index.html#!/notasparciais" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
          >
            Acessar site oficial da escola
            <ExternalLink size={14} />
          </a>
        </div>
        
        {/* Changelog Section */}
        <div className="w-full mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-2 mb-4">
              <History size={16} className="text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Novidades da Versão
              </span>
           </div>
           
           <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {changelog.map((log, index) => (
                <div key={index} className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                   <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                          v{log.version}
                        </span>
                        {/* Indicador de "Novo" para a versão mais recente */}
                        {index === 0 && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {getRelativeTime(log.date)}
                      </span>
                   </div>
                   <ul className="pl-4 mt-2 space-y-1">
                      {log.changes.map((change, cIdx) => (
                        <li key={cIdx} className="text-xs text-slate-600 dark:text-slate-400 list-disc marker:text-slate-300">
                          {change}
                        </li>
                      ))}
                   </ul>
                </div>
              ))}
           </div>
        </div>
        
        <div className="text-center mt-4 space-y-1 w-full">
           <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Em desenvolvimento</p>
           <p className="text-xs text-slate-400 dark:text-slate-600">Pode haver alguns erros durante o processo.</p>
        </div>

        {/* Credits */}
        <div className="pt-2 w-full text-center opacity-60 hover:opacity-100 transition-opacity pb-6">
           <p className="text-[10px] text-slate-400 dark:text-slate-600">
              &copy; 2025 Notas da Escolaweb • Created by <span className="font-bold text-slate-500 dark:text-slate-500">Snox</span>
           </p>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;