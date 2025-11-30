import React from 'react';
import { BimesterKey, BimesterScores, ScoreKey } from '../types';
import { Calculator, ClipboardList, GraduationCap, PenTool } from 'lucide-react';

interface InputCardProps {
  id: BimesterKey;
  title: string;
  data: BimesterScores;
  average: number | null;
  onChange: (bimester: BimesterKey, field: ScoreKey, value: string) => void;
  viewMode: 'simple' | 'detailed';
}

const InputCard: React.FC<InputCardProps> = ({ id, title, data, average, onChange, viewMode }) => {
  
  const handleChange = (field: ScoreKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Allow numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(val)) return;
    
    // Limit to max 10
    if (parseFloat(val) > 10) val = '10';
    
    onChange(id, field, val);
  };

  const PASSING_GRADE = 7;
  const POINTS_FACTOR = 3; 

  const getStatusColor = (avg: number | null) => {
    if (avg === null) return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
    
    if (avg >= PASSING_GRADE) {
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20';
    }
    return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20';
  };

  const getScoreColor = (avg: number | null) => {
     if (avg === null) return 'text-slate-400 dark:text-slate-600';
     if (avg >= PASSING_GRADE) return 'text-green-700 dark:text-green-400';
     return 'text-red-700 dark:text-red-400';
  };

  const renderPointsInfo = () => {
    if (average === null) return null;

    if (average < PASSING_GRADE) {
        const missing = (PASSING_GRADE - average) * POINTS_FACTOR;
        return (
            <div className="mt-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                Faltam {missing.toFixed(1)} pts
            </div>
        );
    } else {
        const surplus = (average - PASSING_GRADE) * POINTS_FACTOR;
        return (
            <div className="mt-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                Sobram {surplus.toFixed(1)} pts
            </div>
        );
    }
  };

  // Helper para mostrar recuperação (Agora como um Badge ao lado da nota)
  const renderRecoveryBadge = () => {
    if (!data.recuperacao) return null;
    const recVal = parseFloat(data.recuperacao.replace(',', '.'));
    if (isNaN(recVal)) return null;
    const bonus = recVal / 4;

    return (
      <div className="inline-flex flex-col items-center bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-lg px-2 py-1 ml-2 shadow-sm">
         <span className="text-[9px] font-bold text-blue-600 dark:text-blue-300 uppercase leading-none mb-0.5">
            Rec
         </span>
         <span className="text-xs font-bold text-blue-700 dark:text-blue-200 leading-none">
            {recVal.toFixed(1)} <span className="opacity-70 text-[10px]">(+{bonus.toFixed(2)})</span>
         </span>
      </div>
    );
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 ${getStatusColor(average)}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <span className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
            {id === 'b1' || id === 'b2' ? <Calculator size={18} /> : <GraduationCap size={18} />}
          </span>
          {title}
        </h3>
        
        {viewMode === 'detailed' && (
          <div className="text-right flex items-center">
              {/* Se tiver recuperação, mostra ao lado da média no modo detalhado */}
              {renderRecoveryBadge()}
              
              <div className="ml-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider block">Média</span>
                  <span className={`text-2xl font-bold ${getScoreColor(average)}`}>
                      {average !== null ? average.toFixed(1) : '-'}
                  </span>
                  {renderPointsInfo()}
              </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {viewMode === 'simple' ? (
           /* SIMPLE MODE: Single Large Input mapped to AVERAGE (acting as Final Grade) */
           <div className="pt-2 pb-1 flex flex-col items-center">
              <label className="block text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Nota do Bimestre</label>
              
              <div className="flex items-center gap-2 justify-center w-full">
                  <input
                      type="text"
                      inputMode="decimal"
                      placeholder="-"
                      value={data.average || ''} 
                      onChange={handleChange('average')}
                      className={`block w-24 text-center text-4xl font-bold bg-transparent border-b-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-0 outline-none transition-colors ${getScoreColor(average)} placeholder-slate-300 dark:placeholder-slate-700`}
                  />
                  {/* No modo simples, mostra a recuperação ao lado do input principal se existir */}
                  {renderRecoveryBadge()}
              </div>

              {renderPointsInfo()}
           </div>
        ) : (
           /* DETAILED MODE: TM, TB, TD Inputs */
           <>
            {/* TM Input */}
            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">TM (Teste Mensal)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PenTool className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={data.tm}
                        onChange={handleChange('tm')}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors bg-white/80 dark:bg-slate-800"
                    />
                </div>
            </div>

            {/* TB Input */}
            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">TB (Teste Bimestral)</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ClipboardList className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={data.tb}
                        onChange={handleChange('tb')}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors bg-white/80 dark:bg-slate-800"
                    />
                </div>
            </div>

            {/* TD Input */}
            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">TD (Trabalhos/Diversos)</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={data.td}
                        onChange={handleChange('td')}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors bg-white/80 dark:bg-slate-800"
                    />
                </div>
            </div>
           </>
        )}
      </div>
    </div>
  );
};

export default InputCard;