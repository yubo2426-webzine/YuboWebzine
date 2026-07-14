import React, { useState } from 'react';
import { MessageCircleQuestion, Send, Search, Loader2, CheckCircle2, ShieldCheck, X, Info, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const inputCls = "w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all";
const labelCls = "block text-sm font-black text-slate-600 dark:text-slate-300 mb-1.5";

// 개인정보 수집·이용 동의 전문 (담당부서 검토 후 문구 확정 필요)
const PRIVACY_TEXT = `[개인정보 수집·이용 동의]

1. 수집 항목
   - 필수: 성명, 문의 제목·내용, 비밀번호(암호화 저장)
   - 선택: 연락처(휴대전화번호)

2. 수집·이용 목적
   - 문의 접수 및 답변 처리
   - 답변 완료 안내 연락 (연락처 기재 시)

3. 보유·이용 기간
   - 답변 완료 후 1년간 보관 후 지체 없이 파기

4. 동의 거부 권리
   - 동의를 거부할 수 있으며, 거부 시 온라인 문의 등록이
     제한됩니다. (전화 문의: 전북특별자치도교육청 유보통합팀)

※ 비밀번호는 복호화할 수 없는 방식(bcrypt)으로 암호화되어
   저장되며, 관리자도 원문을 확인할 수 없습니다.`;

const InquiryBoard: React.FC = () => {
  const [tab, setTab] = useState<'write' | 'lookup'>('write');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-2">
        <MessageCircleQuestion className="text-indigo-500" size={32}/> 문의하기
      </h2>
      <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">
        문의 내용은 공개되지 않으며, 등록 시 발급되는 <b>문의번호와 비밀번호</b>로 본인만 답변을 확인할 수 있습니다.
      </p>

      <div className="flex gap-2 mb-7">
        {([['write', '문의 등록', <Send key="i" size={15}/>], ['lookup', '내 문의 확인', <Search key="i" size={15}/>]] as const).map(([k, label, icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-6 h-12 rounded-full font-black text-sm flex items-center gap-2 transition-all border ${tab === k ? 'bg-indigo-500 text-white border-indigo-500 shadow' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'write' ? <WriteForm/> : <LookupForm/>}
    </div>
  );
};

const WriteForm: React.FC = () => {
  const [f, setF] = useState({ name: '', phone: '', title: '', content: '', password: '' });
  const [agree, setAgree] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState<number | null>(null);

  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    setError('');
    if (!f.name.trim()) return setError('성명을 입력해 주세요.');
    if (!f.title.trim()) return setError('제목을 입력해 주세요.');
    if (!f.content.trim()) return setError('문의 내용을 입력해 주세요.');
    if (f.password.length < 4) return setError('비밀번호는 4자리 이상 입력해 주세요. (답변 확인 시 필요)');
    if (!agree) return setError('개인정보 수집·이용에 동의해 주세요.');
    if (!supabase) return setError('서버 연결에 실패했습니다.');
    setBusy(true);
    const { data, error: err } = await supabase.rpc('submit_inquiry', {
      p_name: f.name, p_phone: f.phone, p_title: f.title, p_content: f.content, p_password: f.password,
    });
    setBusy(false);
    if (err) return setError('등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    setDoneId(data as number);
  };

  if (doneId !== null) return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-10 text-center">
      <CheckCircle2 size={60} className="text-emerald-500 mx-auto mb-5"/>
      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">문의가 등록되었습니다</h3>
      <p className="text-slate-500 dark:text-slate-400 font-bold mb-6">아래 문의번호와 등록 시 입력한 비밀번호로<br/>[내 문의 확인]에서 답변을 확인할 수 있습니다.</p>
      <div className="inline-block bg-indigo-50 dark:bg-indigo-900/30 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl py-4 px-10 text-3xl font-black text-indigo-600 dark:text-indigo-300">문의번호 {doneId}번</div>
      <p className="mt-5 text-sm text-slate-400 font-bold">※ 문의번호를 잊으면 답변을 확인할 수 없으니 꼭 메모해 주세요.</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-7 md:p-9">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className={labelCls}>성명 *</label>
          <input className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} placeholder="홍길동"/></div>
        <div><label className={labelCls}>연락처 <span className="text-slate-400 font-bold">(선택)</span></label>
          <input className={inputCls} value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="010-1234-5678" inputMode="tel"/></div>
      </div>
      <div className="mt-4"><label className={labelCls}>제목 *</label>
        <input className={inputCls} value={f.title} onChange={e => set('title', e.target.value)} placeholder="문의 제목을 입력해 주세요"/></div>
      <div className="mt-4"><label className={labelCls}>내용 *</label>
        <textarea value={f.content} onChange={e => set('content', e.target.value)} rows={6}
          className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" placeholder="문의하실 내용을 자세히 적어주세요."/>
        <p className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
          <Info size={13} className="mt-0.5 shrink-0"/>
          문의 내용에는 주민등록번호, 주소, 아동 정보 등 불필요한 개인정보를 기재하지 말아 주세요.
        </p></div>
      <div className="mt-4 md:w-1/2"><label className={labelCls}>비밀번호 * <span className="text-slate-400 font-bold">(답변 확인용, 4자리 이상)</span></label>
        <input type="password" className={inputCls} value={f.password} onChange={e => set('password', e.target.value)} placeholder="••••"/></div>

      <div className="mt-5 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3">
        <button type="button" onClick={() => setAgree(v => !v)}
          className="flex items-center gap-3 cursor-pointer font-bold text-sm text-slate-700 dark:text-slate-300 text-left">
          <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${agree ? 'bg-indigo-500 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500'}`}>
            {agree && <Check size={16} className="text-white" strokeWidth={3}/>}
          </span>
          <ShieldCheck size={16} className="text-emerald-500 shrink-0"/>(필수) 개인정보 수집·이용에 동의합니다.
        </button>
        <button onClick={() => setShowTerms(v => !v)} className="text-xs font-black text-indigo-500 shrink-0 hover:underline">전문 보기</button>
      </div>
      {showTerms && (
        <div className="mt-3 bg-slate-100 dark:bg-slate-900 rounded-2xl p-5 text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line relative">
          <button onClick={() => setShowTerms(false)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X size={14}/></button>
          {PRIVACY_TEXT}
        </div>
      )}

      {error && <p className="mt-4 text-sm font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-3">{error}</p>}

      <button onClick={submit} disabled={busy}
        className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-lg flex items-center justify-center gap-2 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60 transition-all shadow-lg">
        {busy ? <Loader2 className="animate-spin" size={22}/> : <><Send size={18}/> 문의 등록</>}
      </button>
    </div>
  );
};

const LookupForm: React.FC = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any | null>(null);

  const lookup = async () => {
    setError(''); setResult(null);
    if (!id.trim() || !password) return setError('문의번호와 비밀번호를 입력해 주세요.');
    if (!supabase) return setError('서버 연결에 실패했습니다.');
    setBusy(true);
    const { data, error: err } = await supabase.rpc('get_my_inquiry', {
      p_id: Number(id.trim().replace(/[^0-9]/g, '')), p_password: password,
    });
    setBusy(false);
    if (err) return setError('조회 중 오류가 발생했습니다.');
    if (!data || data.length === 0) return setError('일치하는 문의가 없습니다. 문의번호와 비밀번호를 확인해 주세요.');
    setResult(data[0]);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-7 md:p-9">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className={labelCls}>문의번호</label>
          <input className={inputCls} value={id} onChange={e => setId(e.target.value)} placeholder="예: 12" inputMode="numeric"/></div>
        <div><label className={labelCls}>비밀번호</label>
          <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••"/></div>
      </div>
      {error && <p className="mt-4 text-sm font-black text-rose-500">{error}</p>}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-slate-800 dark:text-white">{result.title}</span>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${result.status === '답변완료' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>{result.status}</span>
            </div>
            <p className="font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{result.content}</p>
            <p className="mt-3 text-xs text-slate-400 font-bold">{new Date(result.created_at).toLocaleString('ko-KR')}</p>
          </div>
          {result.answer ? (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
              <p className="font-black text-indigo-600 dark:text-indigo-300 text-sm mb-2">답변</p>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{result.answer}</p>
              {result.answered_at && <p className="mt-3 text-xs text-slate-400 font-bold">{new Date(result.answered_at).toLocaleString('ko-KR')}</p>}
            </div>
          ) : (
            <p className="text-center font-bold text-slate-400 text-sm py-3">아직 답변이 등록되지 않았습니다. 조금만 기다려 주세요.</p>
          )}
        </div>
      )}

      <button onClick={lookup} disabled={busy}
        className="mt-6 w-full h-13 py-3.5 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white font-black hover:bg-slate-700 disabled:opacity-60 flex items-center justify-center gap-2">
        {busy ? <Loader2 className="animate-spin" size={20}/> : <><Search size={16}/> 조회하기</>}
      </button>
    </div>
  );
};

export default InquiryBoard;
