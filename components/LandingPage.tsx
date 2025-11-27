import React from 'react';
import { Calculator, Download, ExternalLink, TrendingUp, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onImportClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onImportClick }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-4">
            <TrendingUp size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notas da Escolaweb
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Gerencie suas notas bimestrais, calcule médias e receba dicas de estudo com Inteligência Artificial.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-4 mt-8">
          
          <button 
            onClick={onEnterApp}
            className="group relative flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calculator size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Calculadora</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Preencher notas manualmente</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
          </button>

          <button 
            onClick={onImportClick}
            className="group relative flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 text-left"
          >
             <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Download size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Importar Notas</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Colar do site EscolaWeb (Ctrl+V)</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
          </button>

        </div>

        {/* Footer Link */}
        <div className="pt-8 text-center">
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
        
        <div className="text-center text-xs text-slate-400 dark:text-slate-600 mt-12">
           © 2025 Notas da Escolaweb • Versão 2.0
        </div>

      </div>
    </div>
  );
};

export default LandingPage;