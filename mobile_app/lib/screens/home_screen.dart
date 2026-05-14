import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _supabase = Supabase.instance.client;
  bool _loading = true;
  Map<String, dynamic>? _resident;
  List<dynamic> _news = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        // Fetch Linked Resident
        final links = await _supabase.from('family_links').select('resident_id').eq('family_user_id', user.id).eq('is_active', true);
        if (links.isNotEmpty) {
          final resId = links[0]['resident_id'];
          final residentData = await _supabase.from('residents').select().eq('id', resId).single();
          _resident = residentData;
        }

        // Fetch News
        final newsData = await _supabase.from('news').select().eq('is_published', true).order('created_at', ascending: false).limit(2);
        _news = newsData;
      }
    } catch (e) {
      debugPrint('Error fetching data: $e');
    } finally {
      if(mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text('دار شمس التعافي', style: GoogleFonts.cairo(fontWeight: FontWeight.bold))),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('دار شمس التعافي', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(LucideIcons.bell), onPressed: () {}),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: Color(0xFF1A365D)),
              child: Center(
                child: Text('قائمة الخدمات', style: GoogleFonts.cairo(color: Colors.white, fontSize: 20)),
              ),
            ),
            ListTile(leading: const Icon(LucideIcons.home), title: Text('الرئيسية', style: GoogleFonts.cairo()), onTap: () => Navigator.pop(context)),
            ListTile(leading: const Icon(LucideIcons.user), title: Text('بيانات ابني', style: GoogleFonts.cairo()), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/profile'); }),
            ListTile(leading: const Icon(LucideIcons.newspaper), title: Text('أخبار المصحة', style: GoogleFonts.cairo()), onTap: () { Navigator.pop(context); }),
            ListTile(leading: const Icon(LucideIcons.image), title: Text('معرض الصور', style: GoogleFonts.cairo()), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/gallery'); }),
            ListTile(leading: const Icon(LucideIcons.messageSquare), title: Text('تواصل معنا', style: GoogleFonts.cairo()), onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/contact'); }),
            const Spacer(),
            ListTile(
              leading: const Icon(LucideIcons.logOut, color: Colors.red), 
              title: Text('تسجيل الخروج', style: GoogleFonts.cairo(color: Colors.red)), 
              onTap: () async {
                await _supabase.auth.signOut();
                if(mounted) Navigator.pushReplacementNamed(context, '/login');
              }
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'مرحباً بك',
                      style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1A365D)),
                    ),
                    Text(
                      'متابعة حالة المقيم',
                      style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
                _buildNotificationBadge(),
              ],
            ),
            const SizedBox(height: 20),
            
            // Resident Quick Card
            if (_resident != null) _buildResidentQuickCard(context, _resident!)
            else Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(12)),
              child: Center(child: Text('لا يوجد مقيم مرتبط بحسابك حالياً', style: GoogleFonts.cairo())),
            ),
            
            const SizedBox(height: 24),

            // Progress Summary (Commercial Feature)
            if (_resident != null) _buildProgressSummary(),
            const SizedBox(height: 24),

            // News Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('آخر أخبار المصحة', style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton(onPressed: () {}, child: Text('عرض الكل', style: GoogleFonts.cairo())),
              ],
            ),
            if (_news.isEmpty)
               Text('لا توجد أخبار حالياً', style: GoogleFonts.cairo())
            else
              ..._news.map((n) => _buildNewsItem(
                n['title'] ?? '',
                n['body'] ?? '',
                n['image_url'] ?? 'https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=500',
              )),
            
            const SizedBox(height: 24),
            
            // Contact Buttons
            Row(
              children: [
                Expanded(
                  child: _buildContactButton(LucideIcons.phone, 'اتصال مباشر', Colors.green),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildContactButton(LucideIcons.messageCircle, 'واتساب', Colors.teal),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationBadge() {
    return Stack(
      children: [
        IconButton(icon: const Icon(LucideIcons.bell, size: 28, color: Color(0xFF1A365D)), onPressed: () {}),
        Positioned(
          right: 8,
          top: 8,
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
            child: const Text('1', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  Widget _buildProgressSummary() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD4AF37).withOpacity(0.3)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.trendingUp, color: Color(0xFFD4AF37)),
              const SizedBox(width: 10),
              Text('ملخص التقدم العلاجي', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 15),
          _buildProgressRow('الحالة النفسية', 85, Colors.blue),
          const SizedBox(height: 10),
          _buildProgressRow('التفاعل الاجتماعي', 70, Colors.green),
          const SizedBox(height: 10),
          _buildProgressRow('الالتزام بالبرنامج', 95, Colors.orange),
        ],
      ),
    );
  }

  Widget _buildProgressRow(String label, double value, Color color) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: GoogleFonts.cairo(fontSize: 13)),
            Text('%${value.toInt()}', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: color)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: value / 100,
            minHeight: 6,
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _buildResidentQuickCard(BuildContext context, Map<String, dynamic> res) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF1A365D), Color(0xFF2C5282)]),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 5))],
      ),
      child: Column(
        children: [
          Row(
            children: [
              const CircleAvatar(backgroundColor: Colors.white24, child: Icon(LucideIcons.user, color: Colors.white)),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(res['full_name'] ?? 'غير معروف', style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold)),
                  Text('رقم الملف: ${res['file_number'] ?? '-'}', style: GoogleFonts.cairo(color: Colors.white70, fontSize: 12)),
                ],
              ),
              const Spacer(),
              const Icon(LucideIcons.chevronLeft, color: Colors.white),
            ],
          ),
          const Divider(color: Colors.white12, height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStat('الحالة', res['current_status'] == 'stable' ? 'مستقرة' : res['current_status']),
              _buildStat('المرحلة', res['current_stage'] ?? '-'),
              _buildStat('الحضور', '95%'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: GoogleFonts.cairo(color: Colors.white70, fontSize: 11)),
        Text(value, style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }

  Widget _buildNewsItem(String title, String desc, String imageUrl) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5)],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.only(topRight: Radius.circular(15), bottomRight: Radius.circular(15)),
            child: Image.network(imageUrl, width: 100, height: 100, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(width: 100, height: 100, color: Colors.grey[200], child: const Icon(Icons.image))),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(desc, style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey), maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactButton(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 4),
          Text(label, style: GoogleFonts.cairo(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}
