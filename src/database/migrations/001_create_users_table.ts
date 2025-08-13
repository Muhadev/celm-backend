import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create users table from scratch with ALL columns
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('password').nullable(); // Nullable for OAuth users
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at').nullable();
    
    // New auth flow columns
    table.string('shop_url').unique().nullable();
    table.string('business_name').nullable();
    table.text('business_description').nullable();
    table.string('business_type').nullable(); // 'services', 'products', 'both'
    table.json('location').nullable(); // country, state, localGovernment, address
    table.string('oauth_provider').nullable();
    table.string('oauth_id').nullable();
    table.boolean('is_active').defaultTo(true);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['email']);
    table.index(['shop_url']);
    table.index(['business_type']);
    table.index(['is_active']);
    table.index(['oauth_provider', 'oauth_id']);
  });

  // Create registration sessions table
  await knex.schema.createTable('registration_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable();
    table.string('session_token').unique().notNullable();
    table.json('step_data').defaultTo('{}');
    table.integer('current_step').defaultTo(1);
    table.integer('total_steps').defaultTo(5);
    table.boolean('email_verified').defaultTo(false);
    table.string('verification_token').nullable();
    table.string('oauth_provider').nullable();
    table.string('oauth_id').nullable();
    table.json('oauth_data').nullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['email']);
    table.index(['session_token']);
    table.index(['expires_at']);
  });

  // Create refresh tokens table
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('token').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign key and indexes
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index(['user_id']);
    table.index(['token']);
    table.index(['expires_at']);
  });

  // Create password reset tokens table
  await knex.schema.createTable('password_resets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('token').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign key and indexes
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index(['user_id']);
    table.index(['token']);
    table.index(['expires_at']);
  });

  console.log('✅ Auth flow database schema created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_resets');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('registration_sessions');
  await knex.schema.dropTableIfExists('users');
}