import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _supabase = Supabase.instance.client;
  bool _loading = true;
  List<dynamic> _reports = [];

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        final links = await _supabase.from('family_links').select('resident_id').eq('family_user_id', user.id).eq('is_active', true).eq('can_view_reports', true);
        if (links.isNotEmpty) {
          final resId = links[0]['resident_id'];
          final reportsData = await _supabase
              .from('weekly_reports')
              .select('*, residents(file_number)')
              .eq('resident_id', resId)
              .eq('visible_to_family', true)
              .order('created_at', ascending: false);
          
          if (mounted) {
            setState(() {
              _reports = reportsData;
            });
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching reports: $e');
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
    return Scaffold(
      appBar: AppBar(
        title: Text('التقارير الطبية', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _reports.isEmpty
              ? Center(child: Text('لا توجد تقارير متاحة حالياً', style: GoogleFonts.cairo()))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _reports.length,
                  itemBuilder: (context, index) {
                    final report = _reports[index];
                    final date = DateTime.parse(report['created_at']).toLocal();
                    final formattedDate = '${date.day}/${date.month}/${date.year}';
                    
                    final fileNumber = report['residents']?['file_number'] ?? '';
                    final title = report['report_title'] ?? 'بدون عنوان';
                    
                    return _buildReportCard(
                      context,
                      title,
                      fileNumber,
                      formattedDate,
                      report['report_body'] ?? '',
                      index == 0,
                    );
                  },
                ),
    );
  }

  Widget _buildReportCard(BuildContext context, String title, String fileNumber, String date, String excerpt, bool isLatest) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isLatest ? const Color(0xFF1A365D) : Colors.grey[200],
              borderRadius: const BorderRadius.only(topRight: Radius.circular(20), topLeft: Radius.circular(20)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(title, style: GoogleFonts.cairo(color: isLatest ? Colors.white : Colors.black87, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
                if (isLatest)
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFFD4AF37), borderRadius: BorderRadius.circular(10)),
                    child: Text('الأحدث', style: GoogleFonts.cairo(fontSize: 10, color: Colors.white)),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.calendar, size: 14, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text(date, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                    if (fileNumber.isNotEmpty)
                      Text('ملف: $fileNumber', style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(excerpt, style: GoogleFonts.cairo(height: 1.6, fontSize: 13), maxLines: 3, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 16),
                const Divider(),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () {
                      _showFullReport(context, title, fileNumber, date, excerpt);
                    },
                    icon: const Icon(LucideIcons.eye, size: 18),
                    label: Text('عرض التقرير بالكامل', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showFullReport(BuildContext context, String title, String fileNumber, String date, String content) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          height: MediaQuery.of(context).size.height * 0.8,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(child: Text(title, style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold))),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.calendar, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(date, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                  if (fileNumber.isNotEmpty)
                    Text('ملف: $fileNumber', style: GoogleFonts.cairo(color: Colors.grey, fontSize: 12)),
                ],
              ),
              const Divider(height: 30),
              Expanded(
                child: SingleChildScrollView(
                  child: Text(content, style: GoogleFonts.cairo(height: 1.8, fontSize: 15)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
