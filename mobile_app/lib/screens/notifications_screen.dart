import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _supabase = Supabase.instance.client;
  bool _loading = true;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        // RLS ensures only this user's notifications are returned
        final data = await _supabase
            .from('notifications')
            .select()
            .eq('user_id', user.id)
            .order('created_at', ascending: false);
        if (mounted) setState(() { _notifications = data; });
        // Mark all as read
        await _supabase.from('notifications').update({'is_read': true}).eq('user_id', user.id).eq('is_read', false);
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  Color _getTypeColor(String? type) {
    switch (type) {
      case 'report': return Colors.green;
      case 'update': return Colors.orange;
      case 'alert': return Colors.red;
      default: return const Color(0xFF1A365D);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('الإشعارات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.bell, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    Text('لا توجد إشعارات', style: GoogleFonts.cairo(color: Colors.grey)),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _fetchNotifications,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, i) {
                      final n = _notifications[i];
                      final color = _getTypeColor(n['type']);
                      final isRead = n['is_read'] == true;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: isRead ? Colors.white : color.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(14),
                          border: Border(right: BorderSide(color: color, width: 4)),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6)],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
                                child: Icon(LucideIcons.bell, color: color, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(n['title'] ?? '', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14)),
                                    const SizedBox(height: 4),
                                    Text(n['body'] ?? '', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[700]), maxLines: 3, overflow: TextOverflow.ellipsis),
                                    const SizedBox(height: 6),
                                    Text(
                                      n['created_at'] != null ? DateTime.parse(n['created_at']).toLocal().toString().split(' ')[0] : '',
                                      style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                              if (!isRead)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
