import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Use createClientComponentClient so session is stored in cookies (shared with middleware)
// NOT createClient which stores session in localStorage (invisible to middleware)
export const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

/**
 * وظيفة للتحقق من دور المستخدم الحالي
 */
export const getUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data.role;
};
