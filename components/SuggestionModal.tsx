import React, { useState } from 'react';
import { X, Send, Lightbulb, MessageSquare } from 'lucide-react';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose }) => {
  const [suggestion, setSuggestion] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!suggestion.trim()) return;

    // Como não temos backend, abrimos o cliente de e-mail do usuário
    // com o corpo da mensagem preenchido.
    // Você pode alterar o e-mail de destino abaixo.
    const emailTo = "seu-email@exemplo.com"; 
    const subject = encodeURIComponent("Sugestão de Personalização - Notas Escolaweb");
    const body = encodeURIComponent(`Olá! Tenho uma ideia para o site:\n\n${suggestion}`);

    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_blank');
    
    onClose();
    setSuggestion('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Lightbulb className="text-amber-500" size={20} />
            Ideias & Sugestões
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex gap-3 items-start border border-amber-100 dark:border-amber-800/30">
            <MessageSquare className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Tem alguma ideia de funcionalidade, tema ou melhoria? Escreva abaixo! Sua opinião ajuda a evoluir o site.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Sua Ideia
            </label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Ex: Gostaria de poder alterar a cor de fundo..."
              className="w-full h-32 p-3 text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
          </div>
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
            onClick={handleSend}
            disabled={!suggestion.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send size={16} />
            Enviar Sugestão
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionModal;