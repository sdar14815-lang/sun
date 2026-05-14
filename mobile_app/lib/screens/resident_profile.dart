import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ResidentProfileScreen extends StatefulWidget {
  const ResidentProfileScreen({super.key});

  @override
  State<ResidentProfileScreen> createState() => _ResidentProfileScreenState();
}

class _ResidentProfileScreenState extends State<ResidentProfileScreen> {
  final _supabase = Supabase.instance.client;
  bool _loading = true;
  Map<String, dynamic>? _resident;

  @override
  void initState() {
    super.initState();
    _fetchResidentData();
  }

  Future<void> _fetchResidentData() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        final links = await _supabase.from('family_links').select('resident_id').eq('family_user_id', user.id).eq('is_active', true);
        if (links.isNotEmpty) {
          final resId = links[0]['resident_id'];
          final residentData = await _supabase.from('residents').select().eq('id', resId).single();
          if (mounted) {
            setState(() {
              _resident = residentData;
            });
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching resident: $e');
    } finally {
      if (mounted) {
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
        appBar: AppBar(title: Text('بيانات المقيم', style: GoogleFonts.cairo(fontWeight: FontWeight.bold))),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_resident == null) {
      return Scaffold(
        appBar: AppBar(title: Text('بيانات المقيم', style: GoogleFonts.cairo(fontWeight: FontWeight.bold))),
        body: Center(child: Text('لا يوجد مقيم مرتبط بحسابك', style: GoogleFonts.cairo())),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('بيانات المقيم', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1A365D),
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Resident Header Card
            _buildResidentHeader(_resident!),
            const SizedBox(height: 24),
            
            // Status Section
            _buildSectionTitle('الحالة الحالية'),
            _buildStatusCard(_resident!),
            const SizedBox(height: 24),

            // Progress Section
            _buildSectionTitle('المرحلة العلاجية'),
            _buildStageProgress(_resident!),
            const SizedBox(height: 24),

            // Daily Notes
            _buildSectionTitle('تاريخ الدخول'),
            _buildInfoCard('تاريخ التسجيل', DateTime.parse(_resident!['admission_date'] ?? _resident!['created_at']).toLocal().toString().split(' ')[0]),
            const SizedBox(height: 24),

            // Quick Actions
            _buildSectionTitle('إجراءات سريعة'),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _buildActionCard(Icons.assignment, 'التقارير الطبية', () => Navigator.pushNamed(context, '/reports')),
                _buildActionCard(Icons.contact_support, 'تواصل مع الإدارة', () => Navigator.pushNamed(context, '/contact')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResidentHeader(Map<String, dynamic> res) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 35,
            backgroundColor: const Color(0xFF1A365D).withOpacity(0.1),
            child: const Icon(Icons.person, size: 40, color: Color(0xFF1A365D)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  res['full_name'] ?? 'غير معروف',
                  style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                Text(
                  'رقم الملف: ${res['file_number'] ?? '-'}',
                  style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0, right: 4),
      child: Text(
        title,
        style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1A365D)),
      ),
    );
  }

  Widget _buildStatusCard(Map<String, dynamic> res) {
    final status = res['current_status'];
    final isStable = status == 'stable';
    final color = isStable ? const Color(0xFF48BB78) : Colors.orange;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(isStable ? Icons.check_circle : Icons.warning, color: color),
          const SizedBox(width: 12),
          Text(
            isStable ? 'الحالة مستقرة - تقدم ملحوظ' : (status ?? 'غير معروف'),
            style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildStageProgress(Map<String, dynamic> res) {
    final stage = res['current_stage'] ?? 'المرحلة الأولى';
    double progress = 0.3;
    if (stage.contains('تأهيل') || stage.contains('ثانية')) progress = 0.6;
    if (stage.contains('دمج') || stage.contains('ثالثة')) progress = 0.9;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(stage, style: GoogleFonts.cairo(fontWeight: FontWeight.w600)),
              Text('${(progress * 100).toInt()}%', style: GoogleFonts.cairo(color: const Color(0xFFD4AF37), fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD4AF37)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, String content) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey[500])),
          const SizedBox(height: 4),
          Text(content, style: GoogleFonts.cairo(height: 1.6)),
        ],
      ),
    );
  }

  Widget _buildActionCard(IconData icon, String title, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFF1A365D)),
            const SizedBox(height: 8),
            Text(title, style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
