import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itcuxqdiuqqddmcvmzxl.supabase.co';
const supabaseAnonKey = 'sb_publishable_PKyknPoeSCcrnm6ei9ycUA_mUmAxfoT';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    console.log('Verifying student data in Supabase...');
    
    // Check total count
    const { count, error: countError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
    
    if (countError) console.error('Count Error:', countError);
    else console.log('Total students in DB:', count);

    // Check specific student (ARUM ZULYA MAWARNI)
    const { data: student, error: selectError } = await supabase
        .from('students')
        .select('*')
        .eq('nisn', '82756141')
        .single();
    
    if (selectError) console.error('Select Error:', selectError);
    else {
        console.log('Found Student:', student.name);
        console.log('DOB:', student.dob);
        console.log('Status:', student.status);
    }
}

verify();
