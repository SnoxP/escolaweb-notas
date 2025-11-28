import React from 'react';
import { Calculator, ExternalLink, ChevronRight, FileText } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onPartialImportClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onPartialImportClick }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      <div className="w-full max-w-lg space-y-8 animate-fade-in flex flex-col items-center">
        
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
        <div className="pt-4 text-center">
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
        
        <div className="text-center mt-12 space-y-1 w-full">
           <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Em desenvolvimento</p>
           <p className="text-xs text-slate-400 dark:text-slate-600">Pode haver alguns erros durante o processo.</p>
        </div>

        {/* Credits */}
        <div className="pt-6 w-full text-center opacity-60 hover:opacity-100 transition-opacity">
           <p className="text-[10px] text-slate-400 dark:text-slate-600">
              &copy; 2025 Notas da Escolaweb • Created by <span className="font-bold text-slate-500 dark:text-slate-500">Snox</span>
           </p>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;