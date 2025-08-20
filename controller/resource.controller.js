import pool from '../config/db.js';

// @desc    Get all resources
// @route   GET /api/v1/resources
// @access  Public
export const getResources = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM resources');
        res.status(200).json({ status: 'success', count: rows.length, data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};

// @desc    Create a resource
// @route   POST /api/v1/resources
// @access  Private (Donor)
export const createResource = async (req, res) => {
    const { resource_type, quantity, latitude, longitude } = req.body;
    const donor_id = req.user.id;

    try {
        const { rows } = await pool.query(
            'INSERT INTO resources (donor_id, resource_type, quantity, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [donor_id, resource_type, quantity, latitude, longitude]
        );
        res.status(201).json({ status: 'success', data: rows[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};