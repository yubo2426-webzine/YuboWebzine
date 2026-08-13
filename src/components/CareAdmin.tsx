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
  const [tab, setTab] = useState<'apps' | 'inquiries' | 'slots' | 'stats' | 'center' | 'ops'>('apps');
  const [centerFilter, setCenterFilter] = useState<number | '전체'>('전체');
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

  const centerScoped = centerFilter === '전체' ? apps : apps.filter(a => a.center_id === centerFilter);
  const filteredApps = statusFilter === '전체' ? centerScoped : centerScoped.filter(a => a.status === statusFilter);

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

      <div className="flex flex-wrap gap-2 mb-6">
        {([['apps', '돌봄 신청', <ClipboardList key="i" size={15}/>],
           ...(isAdmin ? [['inquiries', '문의 관리', <MessageCircleQuestion key="i" size={15}/>] as const] : []),
           ['slots', '정원 설정', <Building2 key="i" size={15}/>],
           ...(isAdmin ? [['stats', '통계', <Download key="i" size={15}/>] as const] : []),
           ['center', '기관 정보', <Building2 key="i" size={15}/>],
           ...(isAdmin ? [['ops', '운영·계정', <CheckCircle2 key="i" size={15}/>] as const] : [])] as const).map(([k, label, icon]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-6 h-12 rounded-full font-black text-sm flex items-center gap-2 border transition-all ${tab === k ? 'bg-sky-500 text-white border-sky-500 shadow' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-sky-300'}`}>{icon}{label}{k === 'inquiries' && inquiries.filter(i => i.status === '접수').length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{inquiries.filter(i => i.status === '접수').length}</span>}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={36}/></div>
      ) : tab === 'slots' ? (
        <SlotSettings isAdmin={isAdmin} centers={centers}/>
      ) : tab === 'stats' ? (
        <StatsReport centers={centers}/>
      ) : tab === 'center' ? (
        <CenterInfo isAdmin={isAdmin} centers={centers}/>
      ) : tab === 'ops' ? (
        <AdminOps/>
      ) : tab === 'apps' ? (
        <>
          {/* 상태 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {(() => {
              const weekAgo = new Date(Date.now() - 7 * 86400000);
              const scoped = centerFilter === '전체' ? apps : apps.filter(a => a.center_id === centerFilter);
              const cards = [
                ['최근 7일 신청', scoped.filter(a => new Date(a.created_at) >= weekAgo).length, 'text-sky-500'],
                ['접수 대기', scoped.filter(a => a.status === '접수').length, 'text-amber-500'],
                ['확인 완료', scoped.filter(a => a.status === '확인').length, 'text-emerald-500'],
                ['반려·취소', scoped.filter(a => a.status === '반려' || a.status === '취소').length, 'text-rose-400'],
              ] as const;
              return cards.map(([label, n, color]) => (
                <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-5 py-4">
                  <p className="text-xs font-black text-slate-400">{label}</p>
                  <p className={`text-2xl font-black mt-1 ${color}`}>{n}<span className="text-sm ml-0.5">건</span></p>
                </div>
              ));
            })()}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <select value={centerFilter} onChange={e => setCenterFilter(e.target.value === '전체' ? '전체' : Number(e.target.value))}
                  className="h-10 px-3 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-black text-xs text-slate-600 dark:text-slate-300">
                  <option value="전체">기관 전체</option>
                  {Object.entries(centers).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              )}
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

// ─────────────────────────────────────────────
// 정원 설정: 기관별 요일×시간대 정원 그리드
// 관리자는 기관 선택 가능, 기관 계정은 자기 기관만
// ─────────────────────────────────────────────
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const SLOT_TYPES = ['오전', '오후', '휴일', '방학'] as const;

const SlotSettings: React.FC<{ isAdmin: boolean; centers: Record<number, string> }> = ({ isAdmin, centers }) => {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [grid, setGrid] = useState<Record<string, number>>({});   // key: `${type}-${weekday}`
  const [times, setTimes] = useState<Record<string, { open: string; close: string }>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allowedIds, setAllowedIds] = useState<number[]>([]);

  const DEFAULT_TIMES: Record<string, { open: string; close: string }> = {
    '오전': { open: '07:00', close: '09:00' },
    '오후': { open: '13:00', close: '19:00' },
    '휴일': { open: '09:00', close: '18:00' },
    '방학': { open: '09:00', close: '18:00' },
  };

  // 접근 가능한 기관 목록 결정
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      if (isAdmin) {
        setAllowedIds(Object.keys(centers).map(Number));
      } else {
        const { data: s } = await supabase.auth.getSession();
        if (!s.session) return;
        const { data } = await supabase.from('care_center_contacts').select('center_id').eq('auth_user_id', s.session.user.id);
        setAllowedIds((data || []).map((r: any) => r.center_id));
      }
    })();
  }, [isAdmin, centers]);

  useEffect(() => {
    if (allowedIds.length > 0 && centerId === null) setCenterId(allowedIds[0]);
  }, [allowedIds, centerId]);

  // 선택 기관의 정원 로드
  useEffect(() => {
    (async () => {
      if (!supabase || centerId === null) return;
      const { data } = await supabase.from('care_center_slots')
        .select('care_type, weekday, capacity, open_time, close_time').eq('center_id', centerId);
      const g: Record<string, number> = {};
      const t: Record<string, { open: string; close: string }> = {};
      (data || []).forEach((r: any) => {
        g[`${r.care_type}-${r.weekday}`] = r.capacity;
        if (r.open_time && !t[r.care_type]) {
          t[r.care_type] = {
            open:  String(r.open_time).slice(0, 5),
            close: String(r.close_time).slice(0, 5),
          };
        }
      });
      SLOT_TYPES.forEach(ty => { if (!t[ty]) t[ty] = { ...DEFAULT_TIMES[ty] }; });
      setGrid(g);
      setTimes(t);
      setSaved(false);
    })();
  }, [centerId]);

  const save = async () => {
    if (!supabase || centerId === null) return;

    for (const t of SLOT_TYPES) {
      const v = times[t];
      if (v && v.open >= v.close) {
        alert(`${t} 돌봄의 종료 시각이 시작 시각보다 빠르거나 같습니다.`);
        return;
      }
    }

    setBusy(true);
    const rows = SLOT_TYPES.flatMap(t => WEEKDAYS.map((_, w) => ({
      center_id: centerId, care_type: t, weekday: w,
      capacity: grid[`${t}-${w}`] ?? 0,
      open_time:  times[t]?.open  || DEFAULT_TIMES[t].open,
      close_time: times[t]?.close || DEFAULT_TIMES[t].close,
    })));
    await supabase.from('care_center_slots').upsert(rows, { onConflict: 'center_id,care_type,weekday' });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-7 md:p-9">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h3 className="text-xl font-black text-slate-800 dark:text-white">요일·시간대별 정원 설정</h3>
        {allowedIds.length > 1 && (
          <select value={centerId ?? ''} onChange={e => setCenterId(Number(e.target.value))}
            className="h-11 px-4 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-sm text-slate-700 dark:text-slate-200">
            {allowedIds.map(id => <option key={id} value={id}>{centers[id] || `기관 ${id}`}</option>)}
          </select>
        )}
      </div>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6">
        해당 요일·시간대에 받을 수 있는 최대 아동 수를 입력하세요. <b>0 = 해당 시간대 마감(운영 안 함)</b>.
        정원을 한 번도 저장하지 않은 기관은 "제한 없음"으로 동작합니다.
      </p>

      <div className="mb-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900">
        <h4 className="font-black text-slate-800 dark:text-white mb-1">이용유형별 운영시간</h4>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">
          보호자는 여기서 정한 시간 범위 안에서만 이용 시간을 선택할 수 있습니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SLOT_TYPES.map(t => (
            <div key={t} className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-700 dark:text-slate-200 w-12 shrink-0">{t}</span>
              <input type="time" step={600}
                value={times[t]?.open || ''}
                onChange={e => setTimes(p => ({ ...p, [t]: { ...(p[t] || DEFAULT_TIMES[t]), open: e.target.value } }))}
                className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-white"/>
              <span className="font-black text-slate-400">~</span>
              <input type="time" step={600}
                value={times[t]?.close || ''}
                onChange={e => setTimes(p => ({ ...p, [t]: { ...(p[t] || DEFAULT_TIMES[t]), close: e.target.value } }))}
                className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-white"/>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-bold text-slate-700 dark:text-slate-200">
          <thead>
            <tr>
              <th className="text-left p-2 font-black">시간대</th>
              {WEEKDAYS.map(d => <th key={d} className={`p-2 font-black ${d === '일' ? 'text-rose-500' : d === '토' ? 'text-sky-500' : ''}`}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {SLOT_TYPES.map(t => (
              <tr key={t} className="border-t border-slate-100 dark:border-slate-700">
                <td className="p-2 font-black whitespace-nowrap">{t}</td>
                {WEEKDAYS.map((_, w) => (
                  <td key={w} className="p-1.5">
                    <input type="number" min={0} max={999}
                      value={grid[`${t}-${w}`] ?? ''}
                      placeholder="-"
                      onChange={e => setGrid(prev => ({ ...prev, [`${t}-${w}`]: Math.max(0, Number(e.target.value)) }))}
                      className="w-14 h-11 text-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-sky-400"/>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={busy || centerId === null}
          className="h-12 px-8 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black flex items-center justify-center gap-2 hover:from-sky-600 hover:to-blue-700 disabled:opacity-60 shadow-lg">
          {busy ? <Loader2 className="animate-spin" size={20}/> : '정원·운영시간 저장'}
        </button>
        {saved && <span className="font-black text-emerald-500 flex items-center gap-1.5"><CheckCircle2 size={18}/> 저장되었습니다</span>}
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────
// [관리자] 통계 보고서: 월별 집계 + CSV 다운로드
// ─────────────────────────────────────────────
interface StatRow {
  center_id: number;
  care_type: string;
  use_time: string;
  apps: number;
  children: number;
  cancelled_apps: number;
  avg_lead: number;
}

const StatsReport: React.FC<{ centers: Record<number, string> }> = ({ centers }) => {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<StatRow[]>([]);
  const [leads, setLeads] = useState<{ lead_days: number; apps: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      setLoading(true); setError('');
      const [s, l] = await Promise.all([
        supabase.rpc('get_care_stats', { p_month: month }),
        supabase.rpc('get_care_lead_stats', { p_month: month }),
      ]);
      if (s.error || l.error) {
        setError('통계를 불러오지 못했습니다. 권한을 확인해 주세요.');
        setRows([]); setLeads([]);
      } else {
        setRows((s.data as StatRow[]) || []);
        setLeads((l.data as any[]) || []);
      }
      setLoading(false);
    })();
  }, [month]);

  const name = (id: number) => centers[id] || `기관 ${id}`;

  const totalApps     = rows.reduce((a, r) => a + Number(r.apps), 0);
  const totalChildren = rows.reduce((a, r) => a + Number(r.children), 0);
  const totalCancel   = rows.reduce((a, r) => a + Number(r.cancelled_apps), 0);
  const avgLead = leads.length === 0 ? 0 :
    Math.round(leads.reduce((a, r) => a + r.lead_days * r.apps, 0) /
               leads.reduce((a, r) => a + r.apps, 0) * 10) / 10;

  const byCenter = (() => {
    const m: Record<number, { apps: number; children: number }> = {};
    rows.forEach(r => {
      m[r.center_id] = m[r.center_id] || { apps: 0, children: 0 };
      m[r.center_id].apps     += Number(r.apps);
      m[r.center_id].children += Number(r.children);
    });
    return Object.entries(m)
      .map(([id, v]) => ({ id: Number(id), ...v }))
      .sort((a, b) => b.children - a.children);
  })();

  const byType = (() => {
    const m: Record<string, number> = {};
    rows.forEach(r => { m[r.care_type] = (m[r.care_type] || 0) + Number(r.children); });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  })();

  const maxChildren = Math.max(1, ...byCenter.map(c => c.children));

  const downloadCsv = () => {
    const lines: string[] = [];
    lines.push(`함께누리 돌봄 이용 통계,${month}`);
    lines.push(`총 신청,${totalApps}건,총 이용 아동,${totalChildren}명,취소,${totalCancel}건,평균 선행일수,${avgLead}일`);
    lines.push('');
    lines.push('기관,이용유형,시간대,신청건수,이용아동수,취소건수,평균선행일수');
    rows.forEach(r => lines.push(
      `"${name(r.center_id)}","${r.care_type}","${r.use_time}",${r.apps},${r.children},${r.cancelled_apps},${r.avg_lead}`
    ));
    lines.push('');
    lines.push('선행일수,신청건수');
    leads.forEach(l => lines.push(`${l.lead_days},${l.apps}`));

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `돌봄이용통계_${month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const Card: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <p className="text-xs font-black text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${tone || 'text-slate-800 dark:text-white'}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold"/>
        <button onClick={downloadCsv} disabled={rows.length === 0}
          className="h-12 px-5 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white font-black text-sm flex items-center gap-2 disabled:opacity-40">
          <Download size={15}/> CSV 내려받기
        </button>
        <p className="text-xs font-bold text-slate-400 ml-auto">
          개인정보가 포함되지 않은 익명 통계입니다.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={32}/></div>
      ) : error ? (
        <p className="text-center py-20 font-bold text-rose-500">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-20 font-bold text-slate-400">해당 월의 이용 실적이 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card label="총 신청" value={`${totalApps}건`}/>
            <Card label="총 이용 아동" value={`${totalChildren}명`} tone="text-sky-600 dark:text-sky-400"/>
            <Card label="취소" value={`${totalCancel}건`} tone="text-rose-400"/>
            <Card label="평균 선행일수" value={`${avgLead}일`}/>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5">
            <h4 className="font-black text-slate-800 dark:text-white mb-3">기관별 이용 아동 수</h4>
            <div className="space-y-2">
              {byCenter.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 w-44 shrink-0 truncate">{name(c.id)}</span>
                  <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 rounded-full" style={{ width: `${c.children / maxChildren * 100}%` }}/>
                  </div>
                  <span className="text-xs font-black text-slate-500 w-24 text-right shrink-0">{c.children}명 / {c.apps}건</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5">
            <h4 className="font-black text-slate-800 dark:text-white mb-3">이용 유형별 아동 수</h4>
            <div className="flex flex-wrap gap-2">
              {byType.map(([k, v]) => (
                <span key={k} className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm font-black text-slate-700 dark:text-slate-200">
                  {k} <span className="text-sky-600 dark:text-sky-400">{v}명</span>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 overflow-x-auto">
            <h4 className="font-black text-slate-800 dark:text-white mb-3">기관 · 시간대별 상세</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-black text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-3">기관</th>
                  <th className="py-2 pr-3">유형</th>
                  <th className="py-2 pr-3">시간대</th>
                  <th className="py-2 pr-3 text-right">신청</th>
                  <th className="py-2 pr-3 text-right">아동</th>
                  <th className="py-2 pr-3 text-right">취소</th>
                  <th className="py-2 text-right">평균선행</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    <td className="py-2 pr-3">{name(r.center_id)}</td>
                    <td className="py-2 pr-3">{r.care_type}</td>
                    <td className="py-2 pr-3">{r.use_time}</td>
                    <td className="py-2 pr-3 text-right">{r.apps}</td>
                    <td className="py-2 pr-3 text-right text-sky-600 dark:text-sky-400">{r.children}</td>
                    <td className="py-2 pr-3 text-right">{r.cancelled_apps}</td>
                    <td className="py-2 text-right">{r.avg_lead}일</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leads.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5">
              <h4 className="font-black text-slate-800 dark:text-white mb-1">신청 선행일수 분포</h4>
              <p className="text-xs font-bold text-slate-400 mb-3">이용일 며칠 전에 신청했는지 — 사전신청 기간 설정의 근거 자료</p>
              <div className="flex items-end gap-1 h-28">
                {leads.map(l => {
                  const max = Math.max(...leads.map(x => x.apps));
                  return (
                    <div key={l.lead_days} className="flex-1 flex flex-col items-center gap-1 min-w-[18px]">
                      <div className="w-full bg-sky-400 rounded-t" style={{ height: `${l.apps / max * 88}px` }} title={`${l.lead_days}일 전 · ${l.apps}건`}/>
                      <span className="text-[10px] font-black text-slate-400">{l.lead_days}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// 기관 정보 수정 (기관 계정: 자기 기관 / 관리자: 기관 선택)
// ─────────────────────────────────────────────
const CenterInfo: React.FC<{ isAdmin: boolean; centers: Record<number, string> }> = ({ isAdmin, centers }) => {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [allowedIds, setAllowedIds] = useState<number[]>([]);
  const [info, setInfo] = useState({ phone: '', care_hours: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      if (isAdmin) { setAllowedIds(Object.keys(centers).map(Number)); return; }
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      const { data } = await supabase.from('care_center_contacts').select('center_id').eq('auth_user_id', s.session.user.id);
      setAllowedIds((data || []).map((r: any) => r.center_id));
    })();
  }, [isAdmin, centers]);

  useEffect(() => {
    if (allowedIds.length > 0 && centerId === null) setCenterId(allowedIds[0]);
  }, [allowedIds, centerId]);

  useEffect(() => {
    (async () => {
      if (!supabase || centerId === null) return;
      const { data } = await supabase.from('care_centers')
        .select('phone, care_hours, address').eq('id', centerId).maybeSingle();
      if (data) setInfo({ phone: data.phone || '', care_hours: data.care_hours || '', address: data.address || '' });
      setMsg('');
    })();
  }, [centerId]);

  const save = async () => {
    if (!supabase || centerId === null) return;
    setBusy(true); setMsg('');
    const { error } = await supabase.rpc('update_center_info', {
      p_center_id: centerId, p_phone: info.phone, p_care_hours: info.care_hours, p_address: info.address,
    });
    setBusy(false);
    setMsg(error ? '저장에 실패했습니다. 권한을 확인해 주세요.' : '저장되었습니다. 주소를 바꿨다면 지도 위치는 잠시 후 자동 갱신됩니다.');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-7 md:p-9 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-white">기관 정보 수정</h3>
        {allowedIds.length > 1 && (
          <select value={centerId ?? ''} onChange={e => setCenterId(Number(e.target.value))}
            className="h-11 px-4 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-sm text-slate-700 dark:text-slate-200">
            {allowedIds.map(id => <option key={id} value={id}>{centers[id] || `기관 ${id}`}</option>)}
          </select>
        )}
      </div>
      <div className="space-y-4">
        <div><label className={labelCls}>전화번호</label>
          <input className={inputCls} value={info.phone} onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))} placeholder="063-000-0000"/></div>
        <div><label className={labelCls}>운영 시간</label>
          <input className={inputCls} value={info.care_hours} onChange={e => setInfo(p => ({ ...p, care_hours: e.target.value }))} placeholder="(월~금) 07:30~08:30 / 17:00~20:00"/></div>
        <div><label className={labelCls}>주소</label>
          <input className={inputCls} value={info.address} onChange={e => setInfo(p => ({ ...p, address: e.target.value }))}/></div>
      </div>
      {msg && <p className={`mt-4 text-sm font-black ${msg.includes('실패') ? 'text-rose-500' : 'text-emerald-500'}`}>{msg}</p>}
      <button onClick={save} disabled={busy || centerId === null}
        className="mt-6 h-12 px-8 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black flex items-center justify-center gap-2 hover:from-sky-600 hover:to-blue-700 disabled:opacity-60 shadow-lg">
        {busy ? <Loader2 className="animate-spin" size={20}/> : '저장'}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// [관리자] 운영·계정: 신청 기간 설정 + 기관 계정 연결
// ─────────────────────────────────────────────
const AdminOps: React.FC = () => {
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [periodBusy, setPeriodBusy] = useState(false);
  const [periodMsg, setPeriodMsg] = useState('');
  const [accounts, setAccounts] = useState<{ center_id: number; center_name: string; contact_email: string | null; notify_email: string | null; is_linked: boolean }[]>([]);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkCenter, setLinkCenter] = useState<number | ''>('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState('');

  const loadAll = async () => {
    if (!supabase) return;
    const { data: st } = await supabase.from('app_settings').select('key, value').in('key', ['apply_start', 'apply_end']);
    if (st) {
      const m = Object.fromEntries(st.map((r: any) => [r.key, r.value]));
      setPeriod({ start: m.apply_start || '', end: m.apply_end || '' });
    }
    const { data: ac } = await supabase.rpc('get_center_accounts');
    if (ac) setAccounts(ac as any[]);
  };
  useEffect(() => { loadAll(); }, []);

  const savePeriod = async (clear = false) => {
    if (!supabase) return;
    setPeriodBusy(true); setPeriodMsg('');
    const v = clear ? { start: '', end: '' } : period;
    await supabase.from('app_settings').upsert([
      { key: 'apply_start', value: v.start },
      { key: 'apply_end', value: v.end },
    ]);
    if (clear) setPeriod({ start: '', end: '' });
    setPeriodBusy(false);
    setPeriodMsg(clear ? '상시 접수로 변경되었습니다.' : '신청 기간이 저장되었습니다.');
  };

  const linkAccount = async () => {
    if (!supabase || !linkEmail.trim() || linkCenter === '') { setLinkMsg('이메일과 기관을 모두 선택해 주세요.'); return; }
    setLinkBusy(true); setLinkMsg('');
    const { data, error } = await supabase.rpc('link_center_account', {
      p_email: linkEmail.trim(), p_center_id: linkCenter,
    });
    setLinkBusy(false);
    if (error) { setLinkMsg('연결에 실패했습니다. 관리자 권한을 확인해 주세요.'); return; }
    setLinkMsg(String(data));
    if (String(data).includes('완료')) { setLinkEmail(''); setLinkCenter(''); loadAll(); }
  };

  return (
    <div className="space-y-6">
      {/* 신청 기간 설정 */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-7 md:p-9">
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">신청 기간 설정</h3>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-5">
          기간을 설정하면 그 기간에만 신청을 받습니다. 비워두면 <b>상시 접수</b>입니다.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div><label className={labelCls}>시작일</label>
            <input type="date" value={period.start} onChange={e => setPeriod(p => ({ ...p, start: e.target.value }))}
              className="h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-slate-700 dark:text-slate-200"/></div>
          <div><label className={labelCls}>마감일</label>
            <input type="date" value={period.end} onChange={e => setPeriod(p => ({ ...p, end: e.target.value }))}
              className="h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-slate-700 dark:text-slate-200"/></div>
          <button onClick={() => savePeriod(false)} disabled={periodBusy}
            className="h-12 px-6 rounded-2xl bg-sky-500 text-white font-black hover:bg-sky-600 disabled:opacity-60">기간 저장</button>
          <button onClick={() => savePeriod(true)} disabled={periodBusy}
            className="h-12 px-6 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black hover:bg-slate-300">상시 접수로</button>
        </div>
        {periodMsg && <p className="mt-4 text-sm font-black text-emerald-500">{periodMsg}</p>}
      </div>

      {/* 기관 계정 연결 */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-7 md:p-9">
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">기관 계정 연결</h3>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-5">
          ① Supabase → Authentication → Users → <b>Add user</b>로 기관 담당자 계정(이메일+임시 비밀번호)을 먼저 만든 뒤,<br/>
          ② 아래에서 그 이메일과 기관을 골라 연결하면 해당 계정이 그 기관 대시보드에 접근할 수 있습니다.
        </p>
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div className="flex-1 min-w-52"><label className={labelCls}>담당자 이메일</label>
            <input className={inputCls} value={linkEmail} onChange={e => setLinkEmail(e.target.value)} placeholder="center@example.com"/></div>
          <div><label className={labelCls}>기관</label>
            <select value={linkCenter} onChange={e => setLinkCenter(e.target.value === '' ? '' : Number(e.target.value))}
              className="h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-slate-700 dark:text-slate-200">
              <option value="">기관 선택</option>
              {accounts.map(a => <option key={a.center_id} value={a.center_id}>{a.center_name}</option>)}
            </select></div>
          <button onClick={linkAccount} disabled={linkBusy}
            className="h-12 px-6 rounded-2xl bg-sky-500 text-white font-black hover:bg-sky-600 disabled:opacity-60">
            {linkBusy ? <Loader2 className="animate-spin" size={18}/> : '연결'}
          </button>
        </div>
        {linkMsg && <p className={`mb-4 text-sm font-black ${linkMsg.includes('완료') ? 'text-emerald-500' : 'text-rose-500'}`}>{linkMsg}</p>}

        <div className="space-y-2">
          {accounts.map(a => (
            <div key={a.center_id} className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl px-5 py-3">
              <span className="font-black text-sm text-slate-700 dark:text-slate-200">{a.center_name}</span>
              <span className="flex flex-wrap items-center gap-2 text-xs font-black">
                {a.notify_email && (
                  <span className="text-slate-400" title="신청 알림 메일 주소">✉ {a.notify_email}</span>
                )}
                {a.is_linked
                  ? <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">로그인 연결됨{a.contact_email ? ` · ${a.contact_email}` : ''}</span>
                  : <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">로그인 미연결</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareAdmin;
