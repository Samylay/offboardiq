const { db } = require('../src/config/database');

async function migrate() {
  console.log('Running OffboardIQ migrations...');
  try {
    const [batch, migrations] = await db.migrate.latest({
      directory: './migrations',
    });
    if (migrations.length === 0) {
      console.log('Already up to date.');
    } else {
      console.log(`Batch ${batch}: ${migrations.length} migrations applied`);
      migrations.forEach((m) => console.log(`  - ${m}`));
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
