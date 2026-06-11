import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

// Inisialisasi koneksi klien Supabase agar bisa dipakai di backend SvelteKit
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
