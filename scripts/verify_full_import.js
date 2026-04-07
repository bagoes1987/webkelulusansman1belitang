import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itcuxqdiuqqddmcvmzxl.supabase.co';
const supabaseAnonKey = 'sb_publishable_PKyknPoeSCcrnm6ei9ycUA_mUmAxfoT';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    console.log('Verifying COMPLETE student data in Supabase...');
    
    // Check specific student (ARUM ZULYA MAWARNI)
    const { data: student, error: selectError } = await supabase
        .from('students')
        .select('*')
        .eq('nisn', '82756141')
        .single();
    
    if (selectError) console.error('Select Error:', selectError);
    else {
        console.log('Found Student:', student.name);
        console.log('NIS:', student.nis);
        console.log('Gender:', student.gender);
        console.log('POB:', student.pob);
        console.log('DOB:', student.dob);
        console.log('Kelas:', student.kelas);
        console.log('Status:', student.status);
    }
}

verify();
