import pkg from 'xlsx';
const { readFile, utils } = pkg;
import { createClient } from '@supabase/supabase-js';

// Supabase config
const supabaseUrl = 'https://itcuxqdiuqqddmcvmzxl.supabase.co';
const supabaseAnonKey = 'sb_publishable_PKyknPoeSCcrnm6ei9ycUA_mUmAxfoT';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const filePath = 'd:\\Aplikasi Web AI\\KELULUSAN SMAN1 BELITANG 2026\\public\\DATA SISWA KELAS XII 2026.xlsx';

const monthMap = {
    'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
    'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
    'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
};

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = String(dateStr).trim().split(' ');
    if (parts.length !== 3) return null;
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1].toLowerCase()];
    const year = parts[2];
    if (!day || !month || !year) return null;
    return `${year}-${month}-${day}`;
}

function normalizeGender(genderStr) {
    const g = String(genderStr || '').toUpperCase().trim();
    if (g === 'PEREMPUAN' || g === 'P') return 'P';
    return 'L'; // Default to L if LAKI-LAKI or other
}

async function run() {
    try {
        console.log('Reading Excel file for Gender Fix...');
        const workbook = readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = utils.sheet_to_json(worksheet, {header: 1});

        const students = data.slice(1, 345).map(row => {
            let nisnRaw = String(row[4] || '').trim();
            let nisnFixed = nisnRaw.padStart(10, '0');
            
            return {
                nisn: nisnFixed,
                name: String(row[1] || '').trim(),
                dob: parseDate(row[6]),
                kelas: String(row[7] || '').trim(),
                gender: normalizeGender(row[2]),
                nis: String(row[3] || '').trim(),
                pob: String(row[5] || '').trim(),
                status: 'LULUS',
                notes: 'untuk pengambilan SKHU menunggu informasi dari TU SMAN 1 Belitang.'
            };
        });

        console.log(`Parsed ${students.length} students. Normalizing Gender to L/P...`);

        // Clear existing students except config
        console.log('Clearing existing students...');
        await supabase.from('students').delete().neq('nisn', '__CONFIG_TIMER__');

        // Batch insert
        console.log('Inserting students (Fixed Gender)...');
        const { error } = await supabase.from('students').insert(students);
        if (error) throw error;

        console.log('Successfully imported 344 students with FIXED GENDER (L/P) to Supabase!');
    } catch (e) {
        console.error('FAILED:', e.message);
    }
}

run();
