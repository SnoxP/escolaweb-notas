import React, { useState } from 'react';
import { X, ChevronRight, Copy, Sparkles, PenTool, LayoutTemplate } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Bem-vindo ao Notas Escolaweb",
      description: "Sua calculadora completa de notas escolares. Acompanhe seu desempenho, calcule médias e receba dicas de estudo.",
      icon: <LayoutTemplate size={64} className="text-blue-500" />,
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Importação Automática",
      description: "Acesse o EscolaWeb pelo navegador (o App não permite copiar). Vá em Notas Parciais, selecione tudo (Ctrl+A), copie e cole no botão 'Importar'.",
      icon: <Copy size={64} className="text-emerald-500" />,
      color: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Edição e Simulação",
      description: "Edite qualquer nota clicando nos campos. O sistema calcula automaticamente quanto você precisa tirar para passar de ano.",
      icon: <PenTool size={64} className="text-purple-500" />,
      color: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "Inteligência Artificial",
      description: "Use o botão 'Dicas IA' para receber uma análise personalizada do seu desempenho e estratégias de estudo focadas nas suas dificuldades.",
      icon: <Sparkles size={64} className="text-amber-500" />,
      color: "bg-amber-50 dark:bg-amber-900/20"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      onClose();
      setTimeout(() => setCurrentStep(0), 300); // Reset for next time
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col min-h-[500px]">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
        >
          <X size={24} />
        </button>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-16">
          <div className={`p-8 rounded-full mb-8 ${current.color} transition-colors duration-300`}>
            {current.icon}
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 transition-all duration-300">
            {current.title}
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg transition-all duration-300">
            {current.description}
          </p>
        </div>

        {/* Footer / Navigation */}
        <div className="p-8 pt-0">
          <div className="flex items-center justify-between mb-8">
             {/* Progress Dots */}
             <div className="flex gap-2">
                {steps.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
             </div>
          </div>

          <div className="flex gap-3">
             <button 
               onClick={handlePrev}
               disabled={currentStep === 0}
               className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                 currentStep === 0 
                   ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                   : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
               }`}
             >
               Voltar
             </button>
             
             <button 
               onClick={handleNext}
               className="flex-[2] py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
               {currentStep < steps.length - 1 && <ChevronRight size={18} />}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;