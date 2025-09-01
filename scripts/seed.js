import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting to seed the database...');
    await client.query('BEGIN');

    // Clear existing data to prevent duplicates
    console.log('Clearing existing data...');
    await client.query('TRUNCATE TABLE assignments, resources, aid_requests, contact_info, users, matches RESTART IDENTITY CASCADE');

    // --- 1. Seed Users ---
    console.log('Seeding users...');
    const usersData = [
      { name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin' },
      { name: 'Aria Rahman', email: 'aria@example.com', password: 'password123', role: 'aidrequester' },
      { name: 'Benjir Ahmed', email: 'benjir@example.com', password: 'password123', role: 'aidrequester' },
      { name: 'Celia Khan', email: 'celia@example.com', password: 'password123', role: 'donor' },
      { name: 'David Lee', email: 'david@example.com', password: 'password123', role: 'volunteer' },
      { name: 'Eva Islam', email: 'eva@example.com', password: 'password123', role: 'volunteer' },
    ];

    const seededUsers = [];
    for (const user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      const res = await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        [user.email, hashedPassword, user.role]
      );
      seededUsers.push(res.rows[0]);
    }
    console.log(`${seededUsers.length} users seeded.`);
    
    // --- 2. Seed Contact Info ---
    console.log('Seeding contact info...');
    const contactsData = [
        { user_id: seededUsers[0].id, first_name: 'Admin', last_name: 'User', phone_no: '01700000000', street: 'Admin Office', city: 'Dhaka', state: 'Dhaka' },
        { user_id: seededUsers[1].id, first_name: 'Aria', last_name: 'Rahman', phone_no: '01711111111', street: '123 Gulshan Ave', city: 'Dhaka', state: 'Dhaka' },
        { user_id: seededUsers[2].id, first_name: 'Benjir', last_name: 'Ahmed', phone_no: '01722222222', street: '456 Banani Rd', city: 'Dhaka', state: 'Dhaka' },
        { user_id: seededUsers[3].id, first_name: 'Celia', last_name: 'Khan', phone_no: '01733333333', street: '789 Dhanmondi St', city: 'Dhaka', state: 'Dhaka' },
        { user_id: seededUsers[4].id, first_name: 'David', last_name: 'Lee', phone_no: '01744444444', street: '101 Mirpur Rd', city: 'Dhaka', state: 'Dhaka' },
        { user_id: seededUsers[5].id, first_name: 'Eva', last_name: 'Islam', phone_no: '01755555555', street: '202 Uttara Blvd', city: 'Dhaka', state: 'Dhaka' },
    ];

    for (const contact of contactsData) {
        await client.query(
            'INSERT INTO contact_info (user_id, first_name, last_name, phone_no, street, city, state) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [contact.user_id, contact.first_name, contact.last_name, contact.phone_no, contact.street, contact.city, contact.state]
        );
    }
    console.log(`${contactsData.length} contact info records seeded.`);

    // --- 3. Seed Aid Requests ---
    console.log('Seeding aid requests...');
    const requestsData = [
      { requester_id: seededUsers[1].id, aid_type: 'Clean Water', urgency: 'high', status: 'pending', latitude: 23.7939, longitude: 90.4063 },
      { requester_id: seededUsers[2].id, aid_type: 'Non-perishable Food', urgency: 'medium', status: 'pending', latitude: 23.7746, longitude: 90.3932 },
      { requester_id: seededUsers[1].id, aid_type: 'Medical Supplies', urgency: 'high', status: 'assigned', latitude: 23.7945, longitude: 90.4055 },
         { requester_id: seededUsers[2].id, aid_type: 'Shelter', urgency: 'high', status: 'pending', latitude: 23.7947, longitude: 90.4060 },
    ];
    
    const seededRequests = [];
    for (const req of requestsData) {
        const res = await client.query(
            'INSERT INTO aid_requests (requester_id, aid_type, urgency, status, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.requester_id, req.aid_type, req.urgency, req.status, req.latitude, req.longitude]
        );
        seededRequests.push(res.rows[0]);
    }
    console.log(`${seededRequests.length} aid requests seeded.`);

    // --- 4. Seed Resources ---
    console.log('Seeding resources...');
    const resourcesData = [
      { donor_id: seededUsers[3].id, resource_type: 'Clean Water', quantity: 100, latitude: 23.7508, longitude: 90.3863 },
      { donor_id: seededUsers[3].id, resource_type: 'Medical Supplies', quantity: 50, latitude: 23.7515, longitude: 90.3870 },
            { donor_id: seededUsers[3].id, resource_type: 'Shelter', quantity: 1, latitude: 23.7515, longitude: 90.3870 },
    ];

    for (const res of resourcesData) {
        await client.query(
            'INSERT INTO resources (donor_id, resource_type, quantity, latitude, longitude) VALUES ($1, $2, $3, $4, $5)',
            [res.donor_id, res.resource_type, res.quantity, res.latitude, res.longitude]
        );
    }
    console.log(`${resourcesData.length} resources seeded.`);

    // --- 5. Seed Assignments (for the 'assigned' request) ---
    console.log('Seeding assignments...');
    const adminId = seededUsers.find(u => u.role === 'admin').id;
    const volunteerId = seededUsers.find(u => u.role === 'volunteer').id;
    const assignedRequest = seededRequests.find(r => r.status === 'assigned');

    if (assignedRequest) {
        await client.query(
            'INSERT INTO assignments (request_id, volunteer_id, assigned_by_admin_id) VALUES ($1, $2, $3)',
            [assignedRequest.id, volunteerId, adminId]
        );
        console.log('1 assignment seeded.');
    }


    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
  } finally {
    client.release();
    pool.end();
  }
};

seedDatabase();

