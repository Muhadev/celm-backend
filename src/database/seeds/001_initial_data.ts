import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('businesses').del();
  await knex('users').del();

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const adminId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  // Create test user
  const userPassword = await bcrypt.hash('User123!', 12);
  const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';

  // Insert users
  await knex('users').insert([
    {
      id: adminId,
      email: 'admin@celm.com',
      password: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'super_admin',
      status: 'active',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: userId,
      email: 'user@celm.com',
      password: userPassword,
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      status: 'active',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]);

  // Insert sample businesses - using correct column names
  await knex('businesses').insert([
    {
      id: 'b47ac10b-58cc-4372-a567-0e02b2c3d481',
      ownerId: userId, // Note: this matches the column name in the migration
      name: 'Tech Solutions Inc',
      description: 'Professional web development and IT consulting services',
      type: 'services',
      services: JSON.stringify(['Web Development', 'IT Consulting', 'Cloud Services']),
      categories: JSON.stringify(['Technology', 'Software', 'Consulting']),
      website: 'https://techsolutions.example.com',
      location: JSON.stringify({
        country: 'United States',
        state: 'California',
        city: 'San Francisco',
        address: '123 Tech Street',
        postalCode: '94105',
        timezone: 'America/Los_Angeles'
      }),
      contact: JSON.stringify({
        email: 'contact@techsolutions.example.com',
        phone: '+1-555-0123',
        website: 'https://techsolutions.example.com',
        socialMedia: ['@techsolutions']
      }),
      businessHours: JSON.stringify({
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '14:00', closed: false },
        sunday: { closed: true }
      }),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]);

  console.log('✅ Seed data inserted successfully');
}