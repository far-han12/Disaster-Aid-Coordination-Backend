import pool from '../config/db.js';

export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        // Join users and contact_info tables to get all user details
        const query = `
            SELECT 
                u.id, 
                u.email, 
                u.role, 
                c.first_name, 
                c.last_name 
            FROM users u
            LEFT JOIN contact_info c ON u.id = c.user_id
            WHERE u.id = $1
        `;
        const { rows } = await pool.query(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        const userProfile = rows[0];

        res.status(200).json({
            status: 'success',
            data: {
                user: userProfile,
            },
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};
// @desc    Create or update the logged-in user's contact info
// @route   POST /api/v1/users/me/contact-info
// @access  Private
// @desc    Get the logged-in user's contact info
// @route   GET /api/v1/users/me/contact-info
// @access  Private
export const createMyContactInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone_no, street, city, state } = req.body;
        const query = `
            INSERT INTO contact_info (user_id, first_name, last_name, phone_no, street, city, state)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id) DO UPDATE SET
                first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
                phone_no = EXCLUDED.phone_no, street = EXCLUDED.street,
                city = EXCLUDED.city, state = EXCLUDED.state
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [userId, first_name, last_name, phone_no, street, city, state]);
        res.status(201).json({ status: 'success', data: { contactInfo: rows[0] } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

export const getMyContactInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { rows } = await pool.query('SELECT * FROM contact_info WHERE user_id = $1', [userId]);
        if (rows.length === 0) return res.status(200).json({ status: 'success', data: {} });
        res.status(200).json({ status: 'success', data: { contactInfo: rows[0] } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};