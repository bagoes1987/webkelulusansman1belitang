import pkg from 'xlsx';
const { readFile, utils } = pkg;
import { writeFileSync } from 'fs';

const filePath = 'd:\\Aplikasi Web AI\\KELULUSAN SMAN1 BELITANG 2026\\public\\DATA SISWA KELAS XII 2026.xlsx';
const outputPath = 'd:\\Aplikasi Web AI\\KELULUSAN SMAN1 BELITANG 2026\\src\\data\\students.json';

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
    return 'L';
}

try {
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

    writeFileSync(outputPath, JSON.stringify(students, null, 2));
    console.log(`Successfully updated ${students.length} students with FIXED GENDER in src/data/students.json`);
} catch (e) {
    console.error(e);
}
