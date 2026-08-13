export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Supabase Webhook에서 온 요청이 맞는지 확인
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.APP_NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const record = req.body?.record;
    if (!record) return res.status(400).json({ error: 'No record' });

    // 기관 이름 + 기관 알림 이메일 조회
    const centerRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/care_centers?id=eq.${record.center_id}&select=name,notify_email`,
      { headers: { apikey: process.env.SUPABASE_KEY, Authorization: `Bearer ${process.env.SUPABASE_KEY}` } }
    );
    const centerData = await centerRes.json();
    const centerName  = centerData?.[0]?.name || `기관 #${record.center_id}`;
    const centerEmail = centerData?.[0]?.notify_email || null;

    // 수신자 구성 : 기관 담당자 + 교육청 관리자 (중복 제거)
    const adminEmails = (process.env.ADMIN_NOTIFY_EMAIL || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const recipients = [...new Set([centerEmail, ...adminEmails].filter(Boolean))];

    if (recipients.length === 0) {
      console.error('수신자 없음: notify_email / ADMIN_NOTIFY_EMAIL 확인 필요');
      return res.status(200).json({ ok: true, skipped: 'no recipient' });
    }

    const html = `
      <h2>새 돌봄 이용 신청이 접수되었습니다</h2>
      <ul>
        <li>접수번호: ${record.receipt_no}</li>
        <li>기관: ${centerName}</li>
        <li>보호자: ${record.guardian_name} (${record.guardian_phone})</li>
        <li>아동: ${record.child_names} (${record.child_count}명)</li>
        <li>이용 유형: ${record.care_type}</li>
        <li>이용 희망일: ${record.use_date}</li>
        <li>희망 시간대: ${record.use_time || '-'}</li>
        <li>전달사항: ${record.memo || '-'}</li>
      </ul>
      <p style="color:#888;font-size:12px">
        본 메일은 개인정보를 포함합니다. 열람 후 지체 없이 삭제해 주시고, 외부에 전달하지 마십시오.<br>
        신청 내역의 개인정보는 이용일 다음 날 시스템에서 자동 파기됩니다.
      </p>`;

    // 수신자별 개별 발송 (서로의 주소가 노출되지 않도록)
    const results = await Promise.allSettled(
      recipients.map(to =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to,
            subject: `[돌봄 신청 접수] ${centerName} - ${record.guardian_name}님`,
            html,
          }),
        }).then(async r => {
          if (!r.ok) throw new Error(`${to}: ${await r.text()}`);
          return to;
        })
      )
    );

    const failed = results.filter(r => r.status === 'rejected');
    failed.forEach(f => console.error('Resend error:', f.reason?.message || f.reason));

    // 일부만 실패해도 웹훅 재시도를 유발하지 않도록 200 반환
    return res.status(200).json({
      ok: true,
      sent: results.length - failed.length,
      failed: failed.length,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
