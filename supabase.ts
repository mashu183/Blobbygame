import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://mnsohiffnyevyczslydi.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijk1M2E2ZTE5LTZkODEtNDIzMS04YzBhLTU2OThiNDc0NjIxOSJ9.eyJwcm9qZWN0SWQiOiJtbnNvaGlmZm55ZXZ5Y3pzbHlkaSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1OTgwODI1LCJleHAiOjIwODEzNDA4MjUsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.ZTK5PQ_wNp-dJbk4z-p1zDh-grN3t_po9ptZFB7KaeA';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };