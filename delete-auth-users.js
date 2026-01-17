// Delete Auth Users Script
// This script deletes users from Supabase Auth system
// Run with: node delete-auth-users.js

import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL');
    console.error('SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Users to delete from auth system
const usersToDelete = [
    '958d819d-b1aa-4899-b4c6-2d9972479a4b', // vijaydp1980@gmail.com
    '328cd624-da2a-4138-8a49-c1d77cc0cfe4', // deepak.vj017@gmail.com
    '048ff9f9-c1b2-46f8-b5ed-5b852ad9cea5', // flowtest@example.com
    '89136bdd-6405-4c6b-bd6e-2b6dd21ec92c', // engagehubonline@gmail.com
    '3d7e4d48-c767-451d-a1a3-471bfad0bfcf'  // test@example.com
];

async function deleteAuthUsers() {
    console.log('Starting deletion of auth users...');
    
    for (const userId of usersToDelete) {
        try {
            console.log(`Attempting to delete user: ${userId}`);
            
            // First, let's check if the user exists
            const { data: user, error: fetchError } = await supabase.auth.admin.getUserById(userId);
            
            if (fetchError) {
                console.error(`Error fetching user ${userId}:`, fetchError);
                continue;
            }
            
            if (!user) {
                console.log(`User ${userId} not found in auth system`);
                continue;
            }
            
            console.log(`Found user: ${user.user.email} (${userId})`);
            
            // Delete the user from auth system
            const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
            
            if (deleteError) {
                console.error(`Error deleting user ${userId}:`, deleteError);
            } else {
                console.log(`✅ Successfully deleted user: ${user.user.email} (${userId})`);
            }
            
        } catch (error) {
            console.error(`Unexpected error deleting user ${userId}:`, error);
        }
    }
    
    console.log('Auth user deletion process completed.');
}

// Run the deletion
deleteAuthUsers().catch(console.error);
