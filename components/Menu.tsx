import React from 'react';
import { X, Download, Trash2, MoonStar, SunMedium, ExternalLink, Sparkles, GraduationCap, HelpCircle } from 'lucide-react';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  onClear: () => void;
  onAiAnalysis: () => void;
  onOpenTutorial: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Menu: React.FC<MenuProps> = ({ 
  isOpen, 
  onClose, 
  onImport, 
  onClear, 
  onAiAnalysis,
  onOpenTutorial,
  toggleTheme, 
  isDarkMode 
}) => {
  return (
    <>
      {/* Overlay (fundo escuro) */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header do Menu */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Menu
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Lista de Ações */}
          <div className="p-4 space-y-2 flex-1 overflow-y-auto">
            
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">
              Ações Principais
            </p>

            <button 
              onClick={() => { onAiAnalysis(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
            >
              <Sparkles size={20} />
              Dicas e Análise IA
            </button>

            <button 
              onClick={() => { onImport(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download size={20} className="text-blue-500" />
              Importar Notas
            </button>

            <div className="my-4 border-t border-slate-100 dark:border-slate-800"></div>

            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Configurações
            </p>

            <button 
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? (
                <MoonStar size={20} className="text-yellow-400" />
              ) : (
                <SunMedium size={20} className="text-orange-500" />
              )}
              {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
            </button>

            <button 
              onClick={() => { onClear(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <Trash2 size={20} />
              Limpar Todos os Dados
            </button>

            <div className="my-4 border-t border-slate-100 dark:border-slate-800"></div>
            
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Ajuda
            </p>

            <button 
              onClick={() => { onOpenTutorial(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <HelpCircle size={20} className="text-purple-500" />
              Como usar o site
            </button>

            <a 
              href="https://cmachado.escolaweb.com.br/index.html#!/notasparciais" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <ExternalLink size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              Acessar EscolaWeb
            </a>
          </div>

          {/* Footer do Menu */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
             <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                   <GraduationCap size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Notas da Escolaweb</p>
                  <p className="text-[10px]">Versão 2.1</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;