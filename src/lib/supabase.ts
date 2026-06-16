import { createClient } from '@supabase/supabase-js';

// 💡 환경 변수가 무조건 문자열(string) 타입이라고 명시합니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// SQL 명령어는 삭제하고 순수 연결 객체만 내보냅니다.
export const supabase = createClient(supabaseUrl, supabaseKey);