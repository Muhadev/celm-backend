import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create businesses table
  await knex.schema.createTable('businesses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ownerId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.string('type').notNullable(); // services, products, hybrid
    table.jsonb('services'); // Array of services offered - using jsonb for GIN indexes
    table.jsonb('categories'); // Array of business categories - using jsonb for GIN indexes
    table.string('website');
    table.jsonb('location'); // Address, city, state, country, etc. - using jsonb for GIN indexes
    table.jsonb('contact'); // Phone, email, social media - using jsonb for GIN indexes
    table.jsonb('businessHours'); // Operating hours - using jsonb for GIN indexes
    table.enu('status', ['pending', 'active', 'suspended', 'rejected']).defaultTo('pending');
    table.timestamps(true, true);

    // Create regular indexes
    table.index(['ownerId'], 'businesses_owner_id_index');
    table.index(['status'], 'businesses_status_index');
    table.index(['type'], 'businesses_type_index');
    table.index(['name'], 'businesses_name_index');
  });

  // Add text search indexes for searchable fields
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS businesses_name_text_search_index 
    ON businesses USING gin(to_tsvector('english', name));
  `);
  
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS businesses_description_text_search_index 
    ON businesses USING gin(to_tsvector('english', coalesce(description, '')));
  `);

  // Add GIN indexes for JSONB columns (now this will work)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS businesses_services_gin_index 
    ON businesses USING gin(services);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS businesses_categories_gin_index 
    ON businesses USING gin(categories);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS businesses_location_gin_index 
    ON businesses USING gin(location);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS businesses_contact_gin_index 
    ON businesses USING gin(contact);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS businesses_business_hours_gin_index 
    ON businesses USING gin("businessHours");
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop indexes first
  await knex.raw('DROP INDEX IF EXISTS businesses_name_text_search_index');
  await knex.raw('DROP INDEX IF EXISTS businesses_description_text_search_index');
  await knex.raw('DROP INDEX IF EXISTS businesses_services_gin_index');
  await knex.raw('DROP INDEX IF EXISTS businesses_categories_gin_index');
  await knex.raw('DROP INDEX IF EXISTS businesses_location_gin_index');
  await knex.raw('DROP INDEX IF EXISTS businesses_contact_gin_index');
  await knex.raw('DROP INDEX IF EXISTS businesses_business_hours_gin_index');
  
  return knex.schema.dropTable('businesses');
}