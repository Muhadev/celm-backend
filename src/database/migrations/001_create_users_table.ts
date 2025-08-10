import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('first_name');
    table.string('last_name');
    table.string('phone_number');
    table.string('profile_image');
    table.enu('role', ['user', 'admin', 'super_admin']).defaultTo('user');
    table.enu('status', ['active', 'inactive', 'suspended', 'pending']).defaultTo('pending');
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
    table.timestamp('last_login');
    table.timestamps(true, true);

    table.index(['email']);
    table.index(['status']);
    table.index(['email_verification_token']);
    table.index(['password_reset_token']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}