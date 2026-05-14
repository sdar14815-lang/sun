# APP & PORTAL DATA FLOW
## تدفق البيانات بين Dashboard وBوابة الأهالي والتطبيق

---

## 1. التدفق الكامل

```
┌──────────────────────────────────────────────────────────┐
│                   Admin Dashboard                         │
│                    (Next.js App)                          │
│                                                           │
│  [Add News] ──────────────────────────────────────────►  │
│  [Add Update + visible=true] ─────────────────────────►  │
│  [Publish Report + visible=true] ─────────────────────►  │
│  [Upload Gallery] ─────────────────────────────────────► │
│  [Reply to Message] ───────────────────────────────────► │
│  [Send Notification] ──────────────────────────────────► │
└─────────────────────────────┬────────────────────────────┘
                              │ Supabase Client (anon key)
                              │ WRITES to database
                              ▼
┌──────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE                            │
│           (Single Source of Truth)                        │
│                                                           │
│  news ──────────── is_published=true ──────────────────► │
│  resident_updates ─ visible_to_family=true ────────────► │
│  weekly_reports ─── status=published                      │
│                 AND visible_to_family=true ─────────────► │
│  gallery ────────── is_visible=true ───────────────────► │
│  messages ────────── reply_text IS NOT NULL ────────────► │
│  notifications ────── user_id = family_id ─────────────► │
└──────────┬──────────────────────────────────┬────────────┘
           │ Supabase Client (anon key)        │ Supabase Client
           │ READS (RLS enforced)              │ READS (RLS enforced)
           ▼                                   ▼
┌────────────────────────┐     ┌─────────────────────────┐
│   Family Web Portal    │     │    Flutter Mobile App    │
│   (Next.js /family/*)  │     │    (Dart/Flutter)        │
│                        │     │                          │
│  /family/news          │     │  GalleryScreen           │
│  /family/gallery       │     │  ReportsScreen           │
│  /family/resident      │     │  HomeScreen (news)       │
│  /family/reports       │     │  ResidentProfileScreen   │
│  /family/messages      │     │  NotificationsScreen     │
│  /family/notifications │     │  ContactScreen           │
└────────────────────────┘     └─────────────────────────┘
```

---

## 2. تفاصيل كل جدول

### `news` table
```
Dashboard writes:
  INSERT/UPDATE/DELETE with any status
  
Portal/App reads (RLS):
  SELECT WHERE is_published = true
```

### `resident_updates` table
```
Dashboard writes:
  INSERT with visible_to_family = true|false
  
Portal/App reads (RLS):
  SELECT WHERE
    visible_to_family = true
    AND resident_id IN (family's linked residents)
    AND family_links.is_active = true
```

### `weekly_reports` table
```
Dashboard writes:
  INSERT/UPDATE with status = 'draft'|'published'
  INSERT/UPDATE with visible_to_family = true|false
  
Portal/App reads (RLS):
  SELECT WHERE
    status = 'published'
    AND visible_to_family = true
    AND resident_id IN (family's linked residents with can_view_reports=true)
```

### `messages` table
```
Dashboard writes:
  UPDATE SET reply_text, status='replied', replied_at, replied_by
  
Portal/App writes:
  INSERT with family_user_id, resident_id, message, status='sent'
  
Portal/App reads (RLS):
  SELECT WHERE family_user_id = auth.uid()
```

### `notifications` table
```
Dashboard writes:
  INSERT with user_id (specific family) OR batch insert for all families
  
Portal/App reads (RLS):
  SELECT WHERE user_id = auth.uid()
  UPDATE SET is_read = true (auto on page load)
```

### `gallery` table
```
Dashboard writes:
  INSERT with gallery_type='general'|'facility'|'resident'
  INSERT with resident_id (if resident type)
  INSERT with is_visible=true|false
  
Portal/App reads (RLS):
  SELECT WHERE
    is_visible = true
    AND (gallery_type != 'resident' OR resident_id IN linked residents)
```

---

## 3. أمثلة على تدفق البيانات

### مثال 1: إضافة خبر
```
1. Admin clicks "إضافة خبر" in /news/add
2. Fills form: title, body, image, is_published=true
3. INSERT INTO news (title, body, image_url, is_published=true)
4. Supabase stores record
5. Family visits /family/news
6. SELECT * FROM news WHERE is_published=true
7. RLS allows → news appears ✅
```

### مثال 2: إضافة تحديث مخفي
```
1. Doctor fills update form with visible_to_family=false
2. INSERT INTO resident_updates (content, visible_to_family=false)
3. Family visits /family/resident
4. SELECT * FROM resident_updates WHERE visible_to_family=true
5. RLS + query filter → update NOT shown ✅
```

### مثال 3: رد على رسالة
```
1. Family sends message via /family/messages
2. INSERT INTO messages (message, status='sent')
3. Admin sees in /messages Inbox
4. Admin clicks Reply, types response
5. UPDATE messages SET reply_text='...', status='replied'
6. Family refreshes /family/messages
7. SELECT * FROM messages WHERE family_user_id = auth.uid()
8. reply_text shown below original message ✅
```

---

## 4. الأمان في كل طبقة

| الطبقة | الحماية |
|--------|---------|
| Frontend (Dashboard) | Middleware blocks family users |
| Frontend (Portal) | Page-level auth check + redirect |
| Database (Supabase) | RLS policies on every table |
| API | anon key only — no service key in client |
| Flutter | Same anon key + Supabase RLS |
