import pool from '../config/db.js';
import { getDistanceFromLatLonInKm } from '../utils/geolocation.js';

// @desc    Get all aid requests with filtering and sorting
// @route   GET /api/v1/requests
// @access  Public
// @desc    Get all aid requests with filtering and sorting
// @route   GET /api/v1/requests
// @access  Public
export const getAidRequests = async (req, res) => {
    try {
        const { urgency, status, type, search } = req.query;
        let query = `
            SELECT ar.*, ci.first_name, ci.last_name, u.email
            FROM aid_requests ar
            JOIN users u ON ar.requester_id = u.id
            JOIN contact_info ci ON u.id = ci.user_id
        `;
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        if (urgency) {
            whereClauses.push(`ar.urgency = $${paramIndex++}`);
            queryParams.push(urgency);
        }
        if (status) {
            whereClauses.push(`ar.status = $${paramIndex++}`);
            queryParams.push(status);
        }
        if (type) {
            whereClauses.push(`ar.aid_type ILIKE $${paramIndex++}`);
            queryParams.push(`%${type}%`);
        }
        if (search) {
            whereClauses.push(`(ci.first_name ILIKE $${paramIndex} OR ci.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        const { rows } = await pool.query(query, queryParams);
        res.status(200).json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};
// @desc    Get all requests for the logged-in user
// @route   GET /api/v1/requests/my-requests
// @access  Private (Requester)
export const getMyRequests = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { rows } = await pool.query('SELECT * FROM aid_requests WHERE requester_id = $1 ORDER BY request_date DESC', [requesterId]);
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};

// @desc    Create an aid request
// @route   POST /api/v1/requests
// @access  Private (Aid Requester)
export const createAidRequest = async (req, res) => {
    const { aid_type, urgency, latitude, longitude } = req.body;
    const requester_id = req.user.id;

    try {
        const { rows } = await pool.query(
            'INSERT INTO aid_requests (requester_id, aid_type, urgency, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [requester_id, aid_type, urgency, latitude, longitude]
        );
        res.status(201).json({ status: 'success', data: rows[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
