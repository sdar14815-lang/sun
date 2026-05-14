import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _messageController = TextEditingController();
  final _supabase = Supabase.instance.client;
  bool _sending = false;

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    setState(() {
      _sending = true;
    });

    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        // Find associated resident
        String? residentId;
        final links = await _supabase.from('family_links').select('resident_id').eq('family_user_id', user.id).eq('is_active', true);
        if (links.isNotEmpty) {
          residentId = links[0]['resident_id'];
        }

        await _supabase.from('messages').insert({
          'family_user_id': user.id,
          'resident_id': residentId,
          'message': _messageController.text.trim(),
          'status': 'new',
        });

        if (mounted) {
          _messageController.clear();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('تم إرسال رسالتك بنجاح', style: GoogleFonts.cairo()),
              backgroundColor: const Color(0xFF2D6A4F),
            ),
          );
        }
      } else {
        throw Exception('User not logged in');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ أثناء الإرسال', style: GoogleFonts.cairo()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _sending = false;
        });
      }
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('تواصل معنا', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'يسعدنا دائماً الرد على استفساراتكم',
              style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1A365D)),
            ),
            const SizedBox(height: 8),
            Text(
              'يمكنكم التواصل المباشر أو إرسال رسالة وسيقوم القسم المختص بالرد عليكم.',
              style: GoogleFonts.cairo(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 30),

            // Direct Contact Cards
            GestureDetector(
              onTap: () => _launchUrl('tel:01115540077'),
              child: _buildContactMethod(
                LucideIcons.phone,
                'اتصال هاتفي',
                '01115540077',
                const Color(0xFF2D6A4F),
              ),
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => _launchUrl('https://wa.me/201115540077'),
              child: _buildContactMethod(
                LucideIcons.messageCircle,
                'مراسلة واتساب',
                'اضغط للمراسلة الفورية',
                const Color(0xFF25D366),
              ),
            ),
            const SizedBox(height: 30),

            // Message Form
            Text(
              'إرسال رسالة للإدارة',
              style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _messageController,
              maxLines: 5,
              textAlign: TextAlign.right,
              decoration: InputDecoration(
                hintText: 'اكتب رسالتك هنا...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                onPressed: _sending ? null : _sendMessage,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A365D),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _sending 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      'إرسال الرسالة',
                      style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactMethod(IconData icon, String title, String subtitle, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
              Text(subtitle, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13)),
            ],
          ),
          const Spacer(),
          Icon(LucideIcons.chevronLeft, color: Colors.grey[400]),
        ],
      ),
    );
  }
}
