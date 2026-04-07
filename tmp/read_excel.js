import pkg from 'xlsx';
const { readFile, utils } = pkg;

const filePath = 'd:\\Aplikasi Web AI\\KELULUSAN SMAN1 BELITANG 2026\\public\\DATA SISWA KELAS XII 2026.xlsx';
try {
    const workbook = readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(worksheet, {header: 1});

    // The user's screenshot confirms NO 344 is at Row 345 (assuming header in Row 1)
    const students = data.slice(1, 345);
    
    let male = 0;
    let female = 0;
    const invalidRows = [];

    students.forEach((row, index) => {
        const id = row[0];
        const name = row[1];
        const gender = String(row[2] || '').toUpperCase().trim();
        
        if (gender === 'L' || gender === 'LAKI-LAKI') {
            male++;
        } else if (gender === 'P' || gender === 'PEREMPUAN') {
            female++;
        } else {
            invalidRows.push({ 
                excelRow: index + 2, 
                id, 
                name, 
                gender: gender || 'EMPTY' 
            });
        }
    });

    console.log(JSON.stringify({
        totalExpected: 344,
        actualCount: students.length,
        male,
        female,
        invalidRows
    }, null, 2));

} catch (e) {
    console.error(e);
}
