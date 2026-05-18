import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final SupabaseClient client = Supabase.instance.client;

  // تسجيل الدخول للأهالي
  static Future<AuthResponse> signIn(String email, String password) async {
    return await client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  // تسجيل الخروج
  static Future<void> signOut() async {
    await client.auth.signOut();
  }

  // الحصول على بيانات المقيم المرتبط بالمستخدم الحالي
  static Future<Map<String, dynamic>?> getLinkedResident() async {
    final user = client.auth.currentUser;
    if (user == null) return null;

    final response = await client
        .from('family_links')
        .select('*, residents(*)')
        .eq('family_user_id', user.id)
        .maybeSingle();

    if (response == null) return null;
    return response['residents'] as Map<String, dynamic>?;
  }

  // الحصول على التحديثات اليومية للمقيم
  static Future<List<Map<String, dynamic>>> getResidentUpdates(String residentId) async {
    final response = await client
        .from('resident_updates')
        .select('*')
        .eq('resident_id', residentId)
        .eq('visible_to_family', true)
        .order('created_at', ascending: false);
    
    return List<Map<String, dynamic>>.from(response);
  }

  // الحصول على الأخبار العامة
  static Future<List<Map<String, dynamic>>> getPublicNews() async {
    final response = await client
        .from('news')
        .select('*')
        .eq('published', true)
        .order('created_at', ascending: false);
    
    return List<Map<String, dynamic>>.from(response);
  }
}
