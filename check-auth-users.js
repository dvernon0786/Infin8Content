// Check Auth Users Script
// This script checks if users exist in Supabase Auth system
// Run with: node check-auth-users.js

import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Users to check
const emailsToCheck = [
    'engagehubonline@gmail.com',
    'vijaydp1980@gmail.com',
    'deepak.vj017@gmail.com', 
    'flowtest@example.com',
    'test@example.com'
];

async function checkAuthUsers() {
    console.log('Checking auth users...\n');
    
    for (const email of emailsToCheck) {
        try {
            console.log(`🔍 Checking: ${email}`);
            
            // Try to get user by email - this might not work directly
            // Alternative: Try to list all users and filter
            const { data: users, error } = await supabase.auth.admin.listUsers();
            
            if (error) {
                console.error(`❌ Error listing users:`, error);
                continue;
            }
            
            // Find user by email in the list
            const user = users.users.find(u => u.email === email);
            
            if (user) {
                console.log(`✅ User found:`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Created: ${user.created_at}`);
                console.log(`   Last Sign In: ${user.last_sign_in_at}`);
                console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
                console.log(`   Phone: ${user.phone || 'N/A'}`);
                console.log('');
            } else {
                console.log(`❌ User not found: ${email}`);
                console.log('');
            }
            
        } catch (error) {
            console.error(`❌ Error checking ${email}:`, error);
        }
    }
    
    console.log('Auth user check completed.');
}

// Alternative method: Try to sign up the user to see if they exist
async function testUserExistence() {
    console.log('\n🧪 Testing user existence via sign-up attempt...\n');
    
    const testEmail = 'engagehubonline@gmail.com';
    const testPassword = 'testpassword123';
    
    try {
        console.log(`🔍 Attempting to sign up: ${testEmail}`);
        
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                emailRedirectTo: undefined,
                data: {
                    email_verified: false,
                },
            },
        });

        if (error) {
            if (error.message.includes('already registered') || error.message.includes('already been registered')) {
                console.log(`✅ User EXISTS in auth system: ${testEmail}`);
                console.log(`   Error: ${error.message}`);
            } else {
                console.log(`❓ Other error: ${error.message}`);
            }
        } else if (data.user) {
            console.log(`✅ User was CREATED (didn't exist before): ${testEmail}`);
            console.log(`   New User ID: ${data.user.id}`);
            
            // Clean up - delete the user we just created
            console.log(`🧹 Cleaning up test user...`);
            await supabase.auth.admin.deleteUser(data.user.id);
            console.log(`✅ Test user deleted`);
        }
        
    } catch (error) {
        console.error(`❌ Test failed:`, error);
    }
}

// Run both checks
checkAuthUsers().then(() => {
    testUserExistence();
}).catch(console.error);
