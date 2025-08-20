import pool from '../config/db.js';
import { getDistanceFromLatLonInKm } from '../utils/geolocation.js';

// @desc    Get all aid requests with filtering and sorting
// @route   GET /api/v1/requests
// @access  Public
export const getAidRequests = async (req, res) => {
    try {
        let query = 'SELECT * FROM aid_requests';
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        // Filtering by urgency
        if (req.query.urgency) {
            whereClauses.push(`urgency = $${paramIndex++}`);
            queryParams.push(req.query.urgency);
        }

        // Filtering by status
        if (req.query.status) {
            whereClauses.push(`status = $${paramIndex++}`);
            queryParams.push(req.query.status);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        // Sorting
        let orderBy = ' ORDER BY request_date DESC'; // Default sort
        if (req.query.sortBy === 'urgency') {
            orderBy = ` ORDER BY
                CASE urgency
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 3
                END`;
        } else if (req.query.sortBy === 'pendingTime') {
            orderBy = ' ORDER BY request_date ASC';
        }
        
        query += orderBy;

        let { rows } = await pool.query(query, queryParams);

        // Geo-based filtering (after fetching from DB)
        const { latitude, longitude, radius } = req.query;
        if (latitude && longitude && radius) {
            rows = rows.filter(request => {
                if (request.latitude && request.longitude) {
                    const distance = getDistanceFromLatLonInKm(latitude, longitude, request.latitude, request.longitude);
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
