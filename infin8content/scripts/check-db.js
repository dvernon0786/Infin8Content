const fs=require('fs'),path=require('path');
fs.readFileSync(path.resolve('.env.local'),'utf-8').split('\n').forEach(l=>{
  const eq=l.indexOf('=');
  if(eq>0) process.env[l.slice(0,eq).trim()]=l.slice(eq+1).trim();
});
const {createClient}=require('@supabase/supabase-js');
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
sb.from('articles').select('id,title,article_plan').eq('id','393ce846-f997-4a5a-affb-9897a6edf0f5').single()
.then(({data,error})=>{
  if(error){console.error(error.message);return;}
  const p=data.article_plan;
  console.log('schema_markup present:', !!p.schema_markup);
  console.log('schema_types:', JSON.stringify(p.schema_types));
  console.log('schema_generated_at:', p.schema_generated_at);
  console.log('seo_score present:', !!p.seo_score);
  console.log('seo_score.overall:', p.seo_score ? p.seo_score.overall : 'n/a');
  console.log('seo_score.recommendations:', p.seo_score ? JSON.stringify(p.seo_score.recommendations) : 'n/a');
});
