// ============================================================
// CareApply.tsx 수정분 — 이용시간 드롭다운
// ============================================================


// ────────────────────────────────────────────
// [A] 파일 상단, CARE_TYPES 상수 아래에 추가
// ────────────────────────────────────────────

const MINUTES = ['00', '10', '20', '30', '40', '50'];

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const pad = (n: number) => String(n).padStart(2, '0');


// ────────────────────────────────────────────
// [B] ApplyForm 컴포넌트 안, useState 선언부에 추가
//     (기존 const [f, setF] = useState({...}) 바로 아래)
// ────────────────────────────────────────────

  const [hours, setHours] = useState<{ open: string; close: string } | null>(null);
  const [sH, setSH] = useState(''); const [sM, setSM] = useState('');
  const [eH, setEH] = useState(''); const [eM, setEM] = useState('');

  // 기관·유형·날짜가 정해지면 운영시간 조회
  useEffect(() => {
    (async () => {
      if (!supabase || !f.use_date || !f.care_type) { setHours(null); return; }
      const { data } = await supabase.rpc('get_center_hours', {
        p_center_id: center.id, p_care_type: f.care_type, p_use_date: f.use_date,
      });
      const row = (data as any[])?.[0];
      setHours(row
        ? { open: String(row.open_time).slice(0, 5), close: String(row.close_time).slice(0, 5) }
        : { open: '06:00', close: '22:00' });
      setSH(''); setSM(''); setEH(''); setEM('');
    })();
  }, [center.id, f.care_type, f.use_date]);

  // 선택값이 바뀔 때마다 "HH:MM~HH:MM" 문자열로 조립
  useEffect(() => {
    set('use_time', (sH && sM && eH && eM) ? `${sH}:${sM}~${eH}:${eM}` : '');
  }, [sH, sM, eH, eM]);

  // ── 드롭다운 옵션 계산
  const openMin  = hours ? toMin(hours.open)  : 0;
  const closeMin = hours ? toMin(hours.close) : 1439;

  const startHours = hours
    ? Array.from({ length: Math.floor(closeMin / 60) - Math.floor(openMin / 60) + 1 },
        (_, i) => pad(Math.floor(openMin / 60) + i))
        .filter(h => toMin(`${h}:50`) >= openMin && toMin(`${h}:00`) < closeMin)
    : [];

  const startMinutes = (!sH || !hours) ? [] : MINUTES.filter(m => {
    const v = toMin(`${sH}:${m}`);
    return v >= openMin && v < closeMin;
  });

  const endHours = (!sH || !sM || !hours) ? [] :
    Array.from({ length: Math.floor(closeMin / 60) - Number(sH) + 1 },
      (_, i) => pad(Number(sH) + i))
      .filter(h => toMin(`${h}:50`) > toMin(`${sH}:${sM}`) && toMin(`${h}:00`) <= closeMin);

  const endMinutes = (!eH || !sH || !sM || !hours) ? [] : MINUTES.filter(m => {
    const v = toMin(`${eH}:${m}`);
    return v > toMin(`${sH}:${sM}`) && v <= closeMin;
  });

  const selCls = "h-12 px-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-40 disabled:cursor-not-allowed";


// ────────────────────────────────────────────
// [C] submit 함수 안, 기존 검증문 아래에 추가
//     (if (!f.use_date) ... 다음 줄)
// ────────────────────────────────────────────

    if (!f.use_time) return setError('이용 시간을 선택해 주세요.');


// ────────────────────────────────────────────
// [D] "희망 시간대" 입력란 전체를 아래로 교체
//
//   기존 (삭제할 부분)
//   <div><label className={labelCls}>희망 시간대 <span ...>(선택)</span></label>
//     <input className={inputCls} value={f.use_time} .../></div>
// ────────────────────────────────────────────

        <div className="md:col-span-2">
          <label className={labelCls}>
            이용 시간 *
            {hours && (
              <span className="text-slate-400 font-bold ml-1.5">
                (운영시간 {hours.open}~{hours.close})
              </span>
            )}
          </label>

          {!f.use_date ? (
            <p className="h-12 flex items-center px-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-400">
              이용 희망일을 먼저 선택해 주세요.
            </p>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <select className={selCls} value={sH}
                onChange={e => { setSH(e.target.value); setSM(''); setEH(''); setEM(''); }}>
                <option value="">시</option>
                {startHours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="font-black text-slate-400">:</span>
              <select className={selCls} value={sM} disabled={!sH}
                onChange={e => { setSM(e.target.value); setEH(''); setEM(''); }}>
                <option value="">분</option>
                {startMinutes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <span className="font-black text-slate-400 px-1">~</span>

              <select className={selCls} value={eH} disabled={!sM}
                onChange={e => { setEH(e.target.value); setEM(''); }}>
                <option value="">시</option>
                {endHours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="font-black text-slate-400">:</span>
              <select className={selCls} value={eM} disabled={!eH}
                onChange={e => setEM(e.target.value)}>
                <option value="">분</option>
                {endMinutes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          {f.use_time && (
            <p className="mt-2 text-sm font-black text-sky-600 dark:text-sky-400">
              선택한 이용 시간: {f.use_time}
            </p>
          )}
        </div>


// ────────────────────────────────────────────
// [E] import 확인 — useEffect 가 없으면 추가
//     import React, { useState, useEffect, useRef } from 'react';
// ────────────────────────────────────────────
