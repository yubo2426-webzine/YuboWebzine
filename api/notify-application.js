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

    // 기관 이름 조회
    const centerRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/care_centers?id=eq.${record.center_id}&select=name`,
      { headers: { apikey: process.env.SUPABASE_KEY, Authorization: `Bearer ${process.env.SUPABASE_KEY}` } }
    );
    const centerData = await centerRes.json();
    const centerName = centerData?.[0]?.name || `기관 #${record.center_id}`;

    // 이메일 발송
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: `[돌봄 신청 접수] ${centerName} - ${record.guardian_name}님`,
        html: `
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
          </ul>`,
      }),
    });

    if (!emailRes.ok) {
      console.error('Resend error:', await emailRes.text());
      return res.status(502).json({ error: 'Email send failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
