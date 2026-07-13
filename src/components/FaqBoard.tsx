import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Faq {
  id: number;
  category: string | null;
  question: string;
  answer: string;
  sort_order: number;
}

const FaqBoard: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [category, setCategory] = useState('전체');

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from('faqs')
        .select('id, category, question, answer, sort_order')
        .order('sort_order')
        .order('id');
      setFaqs((data as Faq[]) || []);
      setLoading(false);
    })();
  }, []);

  const categories = ['전체', ...Array.from(new Set(faqs.map(f => f.category || '일반')))];
  const filtered = category === '전체' ? faqs : faqs.filter(f => (f.category || '일반') === category);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-2">
        <HelpCircle className="text-emerald-500" size={32}/> 자주 묻는 질문
      </h2>
      <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">궁금하신 내용을 먼저 확인해 보세요. 원하는 답을 찾지 못하셨다면 문의하기를 이용해 주세요.</p>

      {categories.length > 2 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-5 py-2 rounded-full font-black text-sm transition-all border ${category === c ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-emerald-300'}`}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={36}/></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">
          <HelpCircle size={48} className="text-slate-200 dark:text-slate-600 mx-auto mb-4"/>
          <p className="text-slate-400 font-black">등록된 FAQ가 아직 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <button onClick={() => setOpenId(openId === f.id ? null : f.id)}
                className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <span className="font-black text-slate-800 dark:text-white flex items-start gap-3">
                  <span className="text-emerald-500 shrink-0">Q.</span>{f.question}
                </span>
                <ChevronDown size={20} className={`text-slate-400 shrink-0 transition-transform ${openId === f.id ? 'rotate-180' : ''}`}/>
              </button>
              {openId === f.id && (
                <div className="px-6 pb-6 pt-1">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line flex items-start gap-3">
                    <span className="text-sky-500 font-black shrink-0">A.</span>
                    <span>{f.answer}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FaqBoard;
