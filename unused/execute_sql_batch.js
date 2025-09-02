import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLBatch(sqlFile, description) {
  console.log(`\nExecuting ${description}...`);
  
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  const statements = sqlContent.split('\n').filter(line => line.trim().length > 0);
  
  console.log(`Total statements to execute: ${statements.length}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    try {
      // Execute raw SQL
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error(`Error on statement ${i + 1}: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        errorCount++;
      } else {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`Processed ${i + 1}/${statements.length} statements`);
        }
      }
    } catch (err) {
      console.error(`Exception on statement ${i + 1}: ${err.message}`);
      errorCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`${description} completed:`);
  console.log(`- Successful: ${successCount}`);
  console.log(`- Errors: ${errorCount}`);
  console.log(`- Total: ${statements.length}`);
  
  return { successCount, errorCount };
}

async function main() {
  try {
    // Execute questions updates first
    const questionResults = await executeSQLBatch('2019_autumn_questions_update.sql', 'Questions Update');
    
    // Execute choices updates
    const choiceResults = await executeSQLBatch('2019_autumn_choices_update.sql', 'Choices Update');
    
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Questions updated: ${questionResults.successCount}/${questionResults.successCount + questionResults.errorCount}`);
    console.log(`Choices updated: ${choiceResults.successCount}/${choiceResults.successCount + choiceResults.errorCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();