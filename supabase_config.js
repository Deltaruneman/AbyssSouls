/* =========================================================================
   supabase_config.js — Cấu hình kết nối Supabase cho Đấu trường & Đồng bộ nhân vật
   1) Tạo dự án Supabase, chạy supabase/schema.sql, deploy function arena-match (xem supabase/README.md)
   2) Điền URL + anon key vào đây (Project Settings -> API).
   anon key là khóa CÔNG KHAI, được phép đặt trong game. TUYỆT ĐỐI KHÔNG đặt service_role key ở đây.
   ========================================================================= */
window.TIU_CLOUD = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_ANON_PUBLIC_KEY"
};
