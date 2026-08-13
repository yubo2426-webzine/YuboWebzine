// ============================================================
// CareAdmin.tsx 의 기존 StatsReport 컴포넌트를 통째로 교체
// (434행 const StatsReport ... 부터 해당 컴포넌트 끝까지)
//
// 변경점 : care_applications(익일 파기) → care_stats(영구 보관)
// ============================================================

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

  // 기관별 집계
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

  // 이용유형별 집계
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
