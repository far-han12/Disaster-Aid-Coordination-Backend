import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const usersData = [
    { email: 'admin@example.com', password: 'password123', role: 'admin' },
    { email: 'requester1@example.com', password: 'password123', role: 'aidrequester' },
    { email: 'requester2@example.com', password: 'password123', role: 'aidrequester' },
    { email: 'donor1@example.com', password: 'password123', role: 'donor' },
    { email: 'donor2@example.com', password: 'password123', role: 'donor' },
    { email: 'volunteer1@example.com', password: 'password123', role: 'volunteer' },
    { email: 'volunteer2@example.com', password: 'password123', role: 'volunteer' },
];

const contactInfoData = [
    { email: 'admin@example.com', first_name: 'Admin', last_name: 'User', phone_no: '555-0100', street: '123 Admin Way', city: 'Dhaka', state: 'Dhaka' },
    { email: 'requester1@example.com', first_name: 'Alice', last_name: 'Smith', phone_no: '555-0101', street: '456 Oak Ave', city: 'Chittagong', state: 'Chittagong' },
    { email: 'requester2@example.com', first_name: 'Bob', last_name: 'Johnson', phone_no: '555-0102', street: '789 Pine Ln', city: 'Sylhet', state: 'Sylhet' },
    { email: 'donor1@example.com', first_name: 'Celia', last_name: 'Khan', phone_no: '555-0103', street: '101 Maple Dr', city: 'Dhaka', state: 'Dhaka' },
    { email: 'donor2@example.com', first_name: 'David', last_name: 'Lee', phone_no: '555-0104', street: '212 Birch Rd', city: 'Dhaka', state: 'Dhaka' },
    { email: 'volunteer1@example.com', first_name: 'Eva', last_name: 'Chen', phone_no: '555-0105', street: '313 Elm St', city: 'Dhaka', state: 'Dhaka' },
    { email: 'volunteer2@example.com', first_name: 'Frank', last_name: 'Garcia', phone_no: '555-0106', street: '414 Cedar Ct', city: 'Dhaka', state: 'Dhaka' },
];

const aidRequestsData = [
    { email: 'requester1@example.com', aid_type: 'Clean Water', quantity: 50, urgency: 'high', latitude: 23.777176, longitude: 90.399452 },
    { email: 'requester2@example.com', aid_type: 'Blankets', quantity: 100, urgency: 'medium', latitude: 24.894930, longitude: 91.868706 },
    { email: 'requester1@example.com', aid_type: 'Medical Supplies', quantity: 10, urgency: 'high', status: 'assigned', latitude: 22.356852, longitude: 91.783180 },
];

const resourcesData = [
    { email: 'donor1@example.com', resource_type: 'Clean Water', quantity: 200, latitude: 23.810331, longitude: 90.412521 },
    { email: 'donor2@example.com', resource_type: 'Blankets', quantity: 500, latitude: 23.815331, longitude: 90.415521 },
    { email: 'donor1@example.com', resource_type: 'Medical Supplies', quantity: 30, latitude: 23.820331, longitude: 90.422521 },
];


async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Deleting all existing data...');
        await client.query('TRUNCATE users, contact_info, aid_requests, resources, assignments, matches RESTART IDENTITY CASCADE');

        // Insert Users
        const userMap = new Map();
        for (const user of usersData) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            const res = await client.query(
                'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
                [user.email, hashedPassword, user.role]
            );
            userMap.set(user.email, res.rows[0].id);
            console.log(`Inserted user: ${user.email}`);
        }

        // Insert Contact Info
        for (const info of contactInfoData) {
            const userId = userMap.get(info.email);
            await client.query(
                'INSERT INTO contact_info (user_id, first_name, last_name, phone_no, street, city, state) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [userId, info.first_name, info.last_name, info.phone_no, info.street, info.city, info.state]
            );
            console.log(`Inserted contact info for: ${info.email}`);
        }

        // Insert Aid Requests
        for (const req of aidRequestsData) {
            const userId = userMap.get(req.email);
            await client.query(
                'INSERT INTO aid_requests (requester_id, aid_type, quantity, urgency, status, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [userId, req.aid_type, req.quantity, req.urgency, req.status || 'pending', req.latitude, req.longitude]
            );
            console.log(`Inserted aid request: ${req.aid_type}`);
        }

        // Insert Resources
        for (const res of resourcesData) {
            const userId = userMap.get(res.email);
            await client.query(
                'INSERT INTO resources (donor_id, resource_type, quantity, latitude, longitude) VALUES ($1, $2, $3, $4, $5)',
                [userId, res.resource_type, res.quantity, res.latitude, res.longitude]
            );
            console.log(`Inserted resource: ${res.resource_type}`);
        }

        await client.query('COMMIT');
        console.log('\nDatabase seeded successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\nError seeding database:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
