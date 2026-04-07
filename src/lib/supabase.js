import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itcuxqdiuqqddmcvmzxl.supabase.co';
const supabaseAnonKey = 'sb_publishable_PKyknPoeSCcrnm6ei9ycUA_mUmAxfoT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
