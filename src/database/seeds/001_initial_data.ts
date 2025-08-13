import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clean up existing data
  await knex('password_resets').del();
  await knex('refresh_tokens').del();
  await knex('registration_sessions').del();
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('TestPassword123!', 12);

  // Insert test users
  await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: hashedPassword,
      shop_url: 'johns-electronics',
      business_name: 'John\'s Electronics Store',
      business_description: 'Premium electronics and gadgets for all your tech needs',
      business_type: 'products',
      location: JSON.stringify({
        country: 'Nigeria',
        state: 'Lagos',
        localGovernment: 'Lagos Island',
        address: '123 Victoria Island, Lagos'
      }),
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'sarah@example.com',
      first_name: 'Sarah',
      last_name: 'Johnson',
      password: hashedPassword,
      shop_url: 'sarahs-consulting',
      business_name: 'Sarah\'s Business Consulting',
      business_description: 'Professional business consulting services to help your company grow',
      business_type: 'services',
      location: JSON.stringify({
        country: 'Nigeria',
        state: 'Abuja',
        localGovernment: 'Abuja Municipal',
        address: '456 Central District, Abuja'
      }),
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'mike@example.com',
      first_name: 'Mike',
      last_name: 'Wilson',
      password: hashedPassword,
      shop_url: 'mikes-marketplace',
      business_name: 'Mike\'s Marketplace',
      business_description: 'One-stop shop for products and services for your home and business',
      business_type: 'both',
      location: JSON.stringify({
        country: 'Nigeria',
        state: 'Kano',
        localGovernment: 'Kano Municipal',
        address: '789 Market Street, Kano'
      }),
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'testuser@celm.com',
      first_name: 'Test',
      last_name: 'User',
      password: hashedPassword,
      shop_url: 'test-shop',
      business_name: 'Test Business',
      business_description: 'A test business for development and testing purposes',
      business_type: 'services',
      oauth_provider: 'google',
      oauth_id: '12345678901234567890',
      location: JSON.stringify({
        country: 'Nigeria',
        state: 'Lagos',
        localGovernment: 'Ikeja',
        address: '101 Test Street, Ikeja'
      }),
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  console.log('✅ Auth flow seed data inserted successfully');
  console.log('📧 Test user emails: john@example.com, sarah@example.com, mike@example.com, testuser@celm.com');
  console.log('🔑 Test password: TestPassword123!');
}