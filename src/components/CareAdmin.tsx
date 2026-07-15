import React, { useState, useEffect, useCallback } from 'react';
import {
  LockKeyhole, LogOut, Loader2, ClipboardList, MessageCircleQuestion,
  CheckCircle2, XCircle, Download, RefreshCw, Building2, Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const inputCls = "w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all";
const labelCls = "block text-sm font-black text-slate-600 dark:text-slate-300 mb-1.5";

interface AppRow {
  id: number; receipt_no: string; center_id: number;
  guardian_name: string; guardian_phone: string;
  child_names: string; child_count: number;
  care_type: string; use_date: string; use_time: string | null;
  memo: string | null; status: string; status_note: string | null; created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  '접수': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  '확인': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  '반려': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  '취소': 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
};

const CareAdmin: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myCenters, setMyCenters] = useState<number[]>([]);

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 로그인한 계정의 역할 판별 (관리자 or 기관)
  useEffect(() => {
    if (!session || !supabase) { setIsAdmin(false); setMyCenters([]); return; }
    (async () => {
      const { data: adminRow } = await supabase.from('app_admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
      setIsAdmin(!!adminRow);
      const { data: contactRows } = await supabase.from('care_center_contacts').select('center_id').eq('auth_user_id', session.user.id);
      setMyCenters((contactRows || []).map((r: any) => r.center_id));
    })();
  }, [session]);

  if (checking) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-sky-500" size={36}/></div>;
  if (!session) return <LoginForm/>;
  if (!isAdmin && myCenters.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <XCircle size={56} className="text-rose-400 mx-auto mb-5"/>
      <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3">권한이 없는 계정입니다</h3>
      <p className="font-bold text-slate-500 dark:text-slate-400 mb-8">이 계정은 관리자 또는 돌봄기관 계정으로 등록되어 있지 않습니다.<br/>교육청 담당자에게 문의해 주세요.</p>
      <button onClick={() => supabase?.auth.signOut()} className="px-8 h-12 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-black">로그아웃</button>
    </div>
  );
  return <Dashboard session={session} isAdmin={isAdmin}/>;
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setError('');
    if (!email.trim() || !password) return setError('이메일과 비밀번호를 입력해 주세요.');
    if (!supabase) return setError('서버 연결에 실패했습니다.');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-9 shadow-lg">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-2">
          <LockKeyhole className="text-sky-500" size={26}/> 기관·관리자 로그인
        </h2>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-7">돌봄 신청 내역과 문의 관리는 승인된 계정만 이용할 수 있습니다.</p>
        <div className="space-y-4">
          <div><label className={labelCls}>이메일</label>
            <input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="user@example.com" autoComplete="username"/></div>
          <div><label className={labelCls}>비밀번호</label>
            <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} autoComplete="current-password"/></div>
        </div>
        {error && <p className="mt-4 text-sm font-black text-rose-500">{error}</p>}
        <button onClick={login} disabled={busy}
          className="mt-6 w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black flex items-center justify-center gap-2 hover:from-sky-600 hover:to-blue-700 disabled:opacity-60 shadow-lg">
          {busy ? <Loader2 className="animate-spin" size={20}/> : '로그인'}
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ session: any; isAdmin: boolean }> = ({ session, isAdmin }) => {
  const [tab, setTab] = useState<'apps' | 'inquiries'>('apps');
  const [apps, setApps] = useState<AppRow[]>([]);
  const [centers, setCenters] = useState<Record<number, string>>({});
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [noteEdit, setNoteEdit] = useState<{ id: number; note: string } | null>(null);
  const [answerEdit, setAnswerEdit] = useState<{ id: number; answer: string } | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [{ data: appData }, { data: centerData }] = await Promise.all([
      supabase.from('care_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('care_centers').select('id, name'),
    ]);
    setApps((appData as AppRow[]) || []);
    setCenters(Object.fromEntries(((centerData as any[]) || []).map(c => [c.id, c.name])));
    if (isAdmin) {
      const { data: inqData } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
      setInquiries(inqData || []);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string, note?: string) => {
    if (!supabase) return;
    const patch: any = { status };
    if (note !== undefined) patch.status_note = note || null;
    const { error } = await supabase.from('care_applications').update(patch).eq('id', id);
    if (!error) { setNoteEdit(null); load(); }
  };

  const saveAnswer = async (id: number, answer: string) => {
    if (!supabase || !answer.trim()) return;
    const { error } = await supabase.from('inquiries')
      .update({ answer: answer.trim(), answered_at: new Date().toISOString(), status: '답변완료' }).eq('id', id);
    if (!error) { setAnswerEdit(null); load(); }
  };

  const downloadCsv = () => {
    const header = ['접수번호','기관','상태','보호자','연락처','아동','아동수','유형','이용일','희망시간','전달사항','기관안내','신청일시'];
    const rows = filteredApps.map(a => [
      a.receipt_no, centers[a.center_id] || a.center_id, a.status, a.guardian_name, a.guardian_phone,
      a.child_names, a.child_count, a.care_type, a.use_date, a.use_time || '', a.memo || '', a.status_note || '',
      new Date(a.created_at).toLocaleString('ko-KR'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['\uFEFF' + [header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `돌봄신청내역_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filteredApps = statusFilter === '전체' ? apps : apps.filter(a => a.status === statusFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Building2 className="text-sky-500" size={30}/> {isAdmin ? '관리자' : '기관'} 대시보드
          </h2>
          <p className="mt-1.5 font-bold text-slate-500 dark:text-slate-400 text-sm">{session.user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="h-11 px-5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 font-black text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:border-sky-300"><RefreshCw size={15}/> 새로고침</button>
          <button onClick={() => supabase?.auth.signOut()} className="h-11 px-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-black text-sm flex items-center gap-2 hover:bg-slate-700"><LogOut size={15}/> 로그아웃</button>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 mb-6">
          {([['apps', '돌봄 신청', <ClipboardList key="i" size={15}/>], ['inquiries', '문의 관리', <MessageCircleQuestion key="i" size={15}/>]] as const).map(([k, label, icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-6 h-12 rounded-full font-black text-sm flex items-center gap-2 border transition-all ${tab === k ? 'bg-sky-500 text-white border-sky-500 shadow' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-sky-300'}`}>{icon}{label}{k === 'inquiries' && inquiries.filter(i => i.status === '접수').length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{inquiries.filter(i => i.status === '접수').length}</span>}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={36}/></div>
      ) : tab === 'apps' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex gap-2">
              {['전체', '접수', '확인', '반려', '취소'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-4 h-10 rounded-full font-black text-xs border transition-all ${statusFilter === s ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                  {s}{s !== '전체' && ` ${apps.filter(a => a.status === s).length}`}</button>
              ))}
            </div>
            <button onClick={downloadCsv} className="h-10 px-5 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center gap-2 hover:bg-emerald-600"><Download size={14}/> CSV 내려받기</button>
          </div>

          {filteredApps.length === 0 ? (
            <p className="text-center font-bold text-slate-400 py-20 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">신청 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {filteredApps.map(a => (
                <div key={a.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-slate-800 dark:text-white">{a.receipt_no}</span>
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                      {isAdmin && <span className="text-xs font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-3 py-1 rounded-full">{centers[a.center_id] || `기관 ${a.center_id}`}</span>}
                    </div>
                    <span className="text-xs font-bold text-slate-400">{new Date(a.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 font-bold text-sm text-slate-600 dark:text-slate-300">
                    <p>보호자: {a.guardian_name} · {a.guardian_phone}</p>
                    <p>아동: {a.child_names} ({a.child_count}명)</p>
                    <p>이용: {a.use_date} · {a.care_type}{a.use_time ? ` · ${a.use_time}` : ''}</p>
                    {a.memo && <p>전달사항: {a.memo}</p>}
                    {a.status_note && <p className="text-sky-600 dark:text-sky-400">기관 안내: {a.status_note}</p>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {a.status === '접수' && (
                      <>
                        <button onClick={() => updateStatus(a.id, '확인')} className="h-10 px-5 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 hover:bg-emerald-600"><CheckCircle2 size={14}/> 확인 처리</button>
                        <button onClick={() => setNoteEdit({ id: a.id, note: '' })} className="h-10 px-5 rounded-full bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 hover:bg-rose-600"><XCircle size={14}/> 반려</button>
                      </>
                    )}
                    {a.status !== '접수' && (
                      <button onClick={() => updateStatus(a.id, '접수')} className="h-10 px-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-300">접수 상태로 되돌리기</button>
                    )}
                  </div>
                  {noteEdit?.id === a.id && (
                    <div className="mt-3 flex gap-2">
                      <input className={inputCls} value={noteEdit.note} onChange={e => setNoteEdit({ id: a.id, note: e.target.value })} placeholder="반려 사유 (보호자 조회 시 표시됩니다)"/>
                      <button onClick={() => updateStatus(a.id, '반려', noteEdit.note)} className="h-12 px-6 rounded-2xl bg-rose-500 text-white font-black text-sm shrink-0 hover:bg-rose-600">반려 확정</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {inquiries.length === 0 ? (
            <p className="text-center font-bold text-slate-400 py-20 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">등록된 문의가 없습니다.</p>
          ) : inquiries.map(q => (
            <div key={q.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-800 dark:text-white">#{q.id} {q.title}</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${q.status === '답변완료' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>{q.status}</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{q.name}{q.phone ? ` · ${q.phone}` : ''} · {new Date(q.created_at).toLocaleString('ko-KR')}</span>
              </div>
              <p className="mt-3 font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{q.content}</p>
              {q.answer && answerEdit?.id !== q.id && (
                <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">답변: {q.answer}</div>
              )}
              {answerEdit?.id === q.id ? (
                <div className="mt-3 flex gap-2">
                  <textarea rows={3} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    value={answerEdit.answer} onChange={e => setAnswerEdit({ id: q.id, answer: e.target.value })} placeholder="답변을 입력하세요"/>
                  <button onClick={() => saveAnswer(q.id, answerEdit.answer)} className="h-12 px-6 rounded-2xl bg-indigo-500 text-white font-black text-sm shrink-0 hover:bg-indigo-600 self-end flex items-center gap-1.5"><Send size={14}/> 게시</button>
                </div>
              ) : (
                <button onClick={() => setAnswerEdit({ id: q.id, answer: q.answer || '' })} className="mt-3 h-10 px-5 rounded-full bg-indigo-500 text-white font-black text-xs hover:bg-indigo-600">{q.answer ? '답변 수정' : '답변 작성'}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareAdmin;
