import React, { useState, useEffect } from 'react';
import { Download, X, Loader2, AlertCircle, Filter } from 'lucide-react';
import { SubjectMap, BimesterKey } from '../types';
import { parseGradesFromText } from '../services/geminiService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: SubjectMap) => void;
  initialMode?: 'general' | 'partial';
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, initialMode = 'general' }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBimester, setSelectedBimester] = useState<BimesterKey | ''>('');

  // Auto-focus logic or mode handling could go here
  useEffect(() => {
    if (isOpen) {
      // If opened in "partial" mode, we could potentially hint the user
      // but strictly speaking, the user still needs to select WHICH bimester.
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcess = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Calls the bulk importer, passing the forced bimester if selected
      const result = await parseGradesFromText(text, selectedBimester || null);
      
      // Check if we got any data (result has keys)
      if (Object.keys(result).length > 0) {
        onImport(result);
        onClose();
        setText(''); 
      } else {
        setError('Não foi possível identificar notas no texto. Certifique-se de copiar a tabela completa do EscolaWeb.');
      }
    } catch (err) {
      setError('Erro ao processar. Verifique o texto e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Download className="text-blue-600 dark:text-blue-500" size={20} />
            Importar Notas
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 space-y-3">
            <p>
              O sistema aceita dois tipos de importação. Copie (Ctrl+A) e cole o texto aqui:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Resultados Gerais:</strong> Detecta automaticamente.
              </li>
              <li>
                <strong>Notas Parciais (Abas):</strong> Selecione abaixo qual bimestre você copiou.
              </li>
            </ul>
          </div>

          {/* Bimester Selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Selecione o Bimestre (Obrigatório para Parciais)
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedBimester}
                onChange={(e) => setSelectedBimester(e.target.value as BimesterKey | '')}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="">Detecção Automática (Resumo/Lista)</option>
                <option value="b1">Forçar 1º Bimestre (Aba Específica)</option>
                <option value="b2">Forçar 2º Bimestre (Aba Específica)</option>
                <option value="b3">Forçar 3º Bimestre (Aba Específica)</option>
                <option value="b4">Forçar 4º Bimestre (Aba Específica)</option>
              </select>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Para o texto com todos os bimestres listados, use "Detecção Automática".
            </p>
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole o texto aqui..."
            className="w-full h-40 p-3 text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mb-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg mb-2 border border-red-100 dark:border-red-900">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleProcess}
            disabled={isLoading || !text.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Processando...
              </>
            ) : (
              'Processar Notas'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;