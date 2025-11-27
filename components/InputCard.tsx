import React from 'react';
import { BimesterKey, BimesterScores, ScoreKey } from '../types';
import { Calculator, ClipboardList, GraduationCap, PenTool } from 'lucide-react';

interface InputCardProps {
  id: BimesterKey;
  title: string;
  data: BimesterScores;
  average: number | null;
  onChange: (bimester: BimesterKey, field: ScoreKey, value: string) => void;
}

const InputCard: React.FC<InputCardProps> = ({ id, title, data, average, onChange }) => {
  
  const handleChange = (field: ScoreKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Allow numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(val)) return;
    
    // Limit to max 10
    if (parseFloat(val) > 10) val = '10';
    
    onChange(id, field, val);
  };

  const PASSING_GRADE = 7;

  const getStatusColor = (avg: number | null) => {
    if (avg === null) return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
    
    // Light Mode: Use colored backgrounds (green-50/red-50) to restore original look
    // Dark Mode: Use tinted backgrounds (green-950/red-950 with opacity)
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

  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 ${getStatusColor(average)}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <span className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
            {id === 'b1' || id === 'b2' ? <Calculator size={18} /> : <GraduationCap size={18} />}
          </span>
          {title}
        </h3>
        <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider block">Média</span>
            <span className={`text-2xl font-bold ${getScoreColor(average)}`}>
                {average !== null ? average.toFixed(1) : '-'}
            </span>
        </div>
      </div>

      <div className="space-y-3">
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
      </div>
    </div>
  );
};

export default InputCard;