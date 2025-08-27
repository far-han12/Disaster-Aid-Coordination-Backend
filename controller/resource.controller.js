import pool from '../config/db.js';
import { getDistanceFromLatLonInKm } from '../utils/geolocation.js';

// @desc    Get all resources with filtering
// @route   GET /api/v1/resources
// @access  Public
export const getResources = async (req, res) => {
    try {
        let query = 'SELECT * FROM resources';
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        // Filtering by resource type
        if (req.query.type) {
            whereClauses.push(`resource_type ILIKE $${paramIndex++}`);
            queryParams.push(`%${req.query.type}%`);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }
        
        let { rows } = await pool.query(query, queryParams);

        // Geo-based filtering (after fetching from DB)
        const { latitude, longitude, radius } = req.query;
        if (latitude && longitude && radius) {
            rows = rows.filter(resource => {
                if (resource.latitude && resource.longitude) {
                    const distance = getDistanceFromLatLonInKm(latitude, longitude, resource.latitude, resource.longitude);
                    return distance <= radius;
                }
                return false;
            });
        }

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
        res.status(201).json({ status: 'success', data: { resource: rows[0] } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
export const getMyResources = async (req, res) => {
    try {
        const donorId = req.user.id;
        const { rows } = await pool.query('SELECT * FROM resources WHERE donor_id = $1 ORDER BY id DESC', [donorId]);
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};