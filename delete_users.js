import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Users to delete
const usersToDelete = [
  {
    id: "64999e57-929c-4de0-8d11-8eae4ceab32a",
    email: "engagehubonline@gmail.com",
    org_id: "039754b3-c797-45b3-b1b5-ad4acab980c0",
    role: "owner",
    auth_user_id: "7bef99a9-6fdf-4e3d-8c23-5e5d2a50ddad"
  },
  {
    id: "c8d30fbd-3910-47e9-b98d-5d249bca77da", 
    email: "dvernon@infin8automation.com",
    org_id: "6bda6437-6776-4133-99b6-3c6c090698d9",
    role: "owner",
    auth_user_id: "422683ad-f0c6-4416-b382-a29ccab7c2f1"
  }
];

async function deleteUsers() {
  console.log('🗑️ Starting user deletion process...');
  
  for (const user of usersToDelete) {
    console.log(`\n📋 Processing user: ${user.email} (${user.id})`);
    
    try {
      // First, check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ Error checking user ${user.email}:`, checkError);
        continue;
      }
      
      if (!existingUser) {
        console.log(`⚠️ User ${user.email} not found in profiles table`);
        continue;
      }
      
      console.log(`✅ Found user: ${existingUser.email}`);
      
      // Delete from auth.users first (foreign key constraint)
      console.log(`🗑️ Deleting from auth.users...`);
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
        user.auth_user_id
      );
      
      if (authDeleteError) {
        console.error(`❌ Error deleting from auth.users:`, authDeleteError);
        console.log(`⚠️ Continuing with profiles deletion...`);
      } else {
        console.log(`✅ Deleted from auth.users`);
      }
      
      // Delete from profiles table
      console.log(`🗑️ Deleting from profiles table...`);
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileDeleteError) {
        console.error(`❌ Error deleting from profiles:`, profileDeleteError);
      } else {
        console.log(`✅ Deleted from profiles table`);
      }
      
      // Check for any related records that might need cleanup
      console.log(`🔍 Checking for related records...`);
      
      // Check articles
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('id, title')
        .eq('user_id', user.id);
      
      if (!articlesError && articles && articles.length > 0) {
        console.log(`📄 Found ${articles.length} articles for user ${user.email}`);
        
        // Delete articles
        const { error: deleteArticlesError } = await supabase
          .from('articles')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteArticlesError) {
          console.error(`❌ Error deleting articles:`, deleteArticlesError);
        } else {
          console.log(`✅ Deleted ${articles.length} articles`);
        }
      }
      
      // Check organizations (if user is owner)
      if (user.role === 'owner') {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', user.org_id)
          .eq('owner_id', user.id);
        
        if (!orgError && org && org.length > 0) {
          console.log(`🏢 Found organization: ${org[0].name}`);
          
          // Check if there are other users in this organization
          const { data: otherUsers, error: otherUsersError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('org_id', user.org_id)
            .neq('id', user.id);
          
          if (!otherUsersError && otherUsers && otherUsers.length > 0) {
            console.log(`⚠️ Organization has ${otherUsers.length} other users, keeping organization`);
            console.log(`👥 Other users:`, otherUsers.map(u => u.email).join(', '));
          } else {
            console.log(`🗑️ No other users in organization, deleting organization...`);
            const { error: deleteOrgError } = await supabase
              .from('organizations')
              .delete()
              .eq('id', user.org_id);
            
            if (deleteOrgError) {
              console.error(`❌ Error deleting organization:`, deleteOrgError);
            } else {
              console.log(`✅ Deleted organization`);
            }
          }
        }
      }
      
      console.log(`✅ Successfully processed user: ${user.email}`);
      
    } catch (error) {
      console.error(`❌ Unexpected error processing user ${user.email}:`, error);
    }
  }
  
  console.log('\n🎉 User deletion process completed!');
  
  // Verify deletion
  console.log('\n🔍 Verifying deletion...');
  for (const user of usersToDelete) {
    const { data: checkUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();
    
    if (checkUser) {
      console.log(`❌ User still exists: ${checkUser.email}`);
    } else {
      console.log(`✅ User successfully deleted: ${user.email}`);
    }
  }
}

// Run the deletion
deleteUsers().catch(console.error);
