import { createClient } from '@supabase/supabase-js';

// 💡 환경 변수가 무조건 문자열(string) 타입이라고 명시합니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);
alter table "전북 영유아체험기관"
add column "위도" float8,
add column "경도" float8;
