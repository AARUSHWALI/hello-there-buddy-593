const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Make sure to use the service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  try {
    // Check if the bucket exists
    console.log('Checking for existing bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'resume');
    
    if (!bucketExists) {
      console.log('Creating resume bucket...');
      const { data: bucket, error: createError } = await supabase.storage
        .createBucket('resume', { public: false });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      console.log('Bucket created successfully!');
    } else {
      console.log('Bucket already exists');
    }

    // Set bucket policies
    console.log('Setting bucket policies...');
    const { data: policies, error: policyError } = await supabase.rpc('set_bucket_policies');
    
    if (policyError) {
      console.error('Error setting policies:', policyError);
      return;
    }
    
    console.log('Storage setup completed successfully!');
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

// Run the setup
setupStorage();
