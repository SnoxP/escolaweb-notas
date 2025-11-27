import React, { useState } from 'react';
import { Download, X, Loader2, AlertCircle } from 'lucide-react';
import { SubjectMap } from '../types';
import { parseGradesFromText } from '../services/geminiService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: SubjectMap) => void;
  // subjectName removed as we now import everything
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcess = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Calls the bulk importer
      const result = await parseGradesFromText(text);
      
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
            Importar Todas as Notas
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Acesse o <strong>EscolaWeb</strong>, dê um <strong>Ctrl+A</strong> na tela de "Resultados Gerais" (ou "Notas Parciais"), copie tudo e cole abaixo. O sistema identificará automaticamente as notas de todas as matérias.
          </p>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole o texto completo aqui..."
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