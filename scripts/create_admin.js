/**
 * Script untuk membuat akun admin di Supabase Auth
 * Jalankan: node scripts/create_admin.js
 * 
 * PENTING: Jalankan script ini SEKALI saja untuk membuat akun admin.
 * Setelah itu, login admin menggunakan email dan password yang sudah didaftarkan.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itcuxqdiuqqddmcvmzxl.supabase.co';
const supabaseAnonKey = 'sb_publishable_PKyknPoeSCcrnm6ei9ycUA_mUmAxfoT';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== KONFIGURASI AKUN ADMIN =====
const ADMIN_EMAIL = 'admin@sman1belitang.sch.id';
const ADMIN_PASSWORD = 'Admin@SMAN1Belitang2026';
// ==================================

async function createAdmin() {
  console.log('🔐 Membuat akun admin di Supabase Auth...\n');
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}\n`);

  const { data, error } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      console.log('⚠️  Akun admin sudah terdaftar sebelumnya.');
      console.log('   Silakan login menggunakan email dan password di atas.\n');
    } else {
      console.error('❌ Gagal membuat akun admin:', error.message);
    }
    return;
  }

  if (data?.user) {
    console.log('✅ Akun admin berhasil dibuat!\n');
    console.log('   User ID:', data.user.id);
    console.log('   Email  :', data.user.email);
    
    if (data.user.identities?.length === 0) {
      console.log('\n⚠️  Email ini sudah terdaftar sebelumnya.');
    }
    
    if (data.session) {
      console.log('\n🎉 Sesi otomatis aktif! Anda bisa langsung login.\n');
    } else {
      console.log('\n📧 Cek email untuk konfirmasi (jika Email Confirmation aktif di Supabase).');
      console.log('   Atau nonaktifkan "Confirm email" di Supabase Dashboard:');
      console.log('   → Authentication → Providers → Email → Disable "Confirm email"\n');
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log(' SIMPAN KREDENSIAL INI:');
  console.log(`   📧 Email    : ${ADMIN_EMAIL}`);
  console.log(`   🔑 Password : ${ADMIN_PASSWORD}`);
  console.log('═══════════════════════════════════════════════════\n');
}

createAdmin();
