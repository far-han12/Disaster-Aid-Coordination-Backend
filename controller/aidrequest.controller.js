import pool from '../config/db.js';
import { getDistanceFromLatLonInKm } from '../utils/geolocation.js';

// @desc    Get all aid requests with filtering and sorting
// @route   GET /api/v1/requests
// @access  Public
export const getAidRequests = async (req, res) => {
    try {
        const { urgency, status, type, search } = req.query;
        let query = `
            SELECT ar.*, ci.first_name, ci.last_name, u.email, ci.city
            FROM aid_requests ar
            JOIN users u ON ar.requester_id = u.id
            JOIN contact_info ci ON u.id = ci.user_id
        `;
        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        if (urgency && urgency !== 'all') {
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
    const { aid_type, urgency, quantity,latitude, longitude } = req.body;
    const requester_id = req.user.id;

    try {
        const { rows } = await pool.query(
            'INSERT INTO aid_requests (requester_id, aid_type, urgency, quantity,latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [requester_id, aid_type, urgency,quantity, latitude, longitude]
        );
        res.status(201).json({ status: 'success', data: rows[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// @desc    Update an aid request
// @route   PATCH /api/v1/requests/:id
// @access  Private (Requester - owner only)
export const updateAidRequest = async (req, res) => {
  try {
    const { id } = req.params;
    let { aid_type, urgency, quantity } = req.body;
    const requesterId = req.user.id;

    // Ownership check
    const ownerCheck = await pool.query(
      'SELECT requester_id FROM aid_requests WHERE id = $1',
      [id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Aid request not found.' });
    }
    if (String(ownerCheck.rows[0].requester_id) !== String(requesterId)) {
      return res.status(403).json({ status: 'fail', message: 'You are not authorized to update this request.' });
    }

    // Optional basic validation
    if (quantity !== undefined) {
      const n = Number(quantity);
      if (!Number.isFinite(n) || n < 1) {
        return res.status(400).json({ status: 'fail', message: 'quantity must be a positive number' });
      }
      quantity = n;
    }

    const { rows } = await pool.query(
      `UPDATE aid_requests
         SET aid_type = $1,
             urgency  = $2,
             quantity = $3
       WHERE id = $4
       RETURNING *`,
      [aid_type, urgency, quantity, id]
    );

    return res.status(200).json({ status: 'success', data: rows[0] });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};


// @desc    Delete an aid request
// @route   DELETE /api/v1/requests/:id
// @access  Private (Requester - owner only)
export const deleteAidRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.id;

        // Security Check: Verify ownership before deleting
        const ownerCheck = await pool.query('SELECT requester_id FROM aid_requests WHERE id = $1', [id]);
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'Aid request not found.' });
        }
        if (ownerCheck.rows[0].requester_id !== requesterId) {
            return res.status(403).json({ status: 'fail', message: 'You are not authorized to delete this request.' });
        }

        await pool.query('DELETE FROM aid_requests WHERE id = $1', [id]);

        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
