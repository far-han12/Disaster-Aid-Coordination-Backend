import pool from '../config/db.js';
import { getDistanceFromLatLonInKm } from '../utils/geolocation.js';

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT u.id, u.email, u.role, c.first_name, c.last_name
            FROM users u
            LEFT JOIN contact_info c ON u.id = c.user_id
        `;
        const queryParams = [];

        if (search) {
            query += ` WHERE u.email ILIKE $1 OR c.first_name ILIKE $1 OR c.last_name ILIKE $1`;
            queryParams.push(`%${search}%`);
        }

        query += ' ORDER BY u.id ASC';

        const { rows } = await pool.query(query, queryParams);
        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};

// @desc    Update a user's role
// @route   PATCH /api/v1/admin/users/:id
// @access  Private (Admin)
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ status: 'fail', message: 'Please provide a role.' });
        }

        const { rows } = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
            [role, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'No user found with that ID' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: rows[0],
            },
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};


// @desc    Delete a user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'fail', message: 'No user found with that ID' });
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};

// @desc    Get a summary of most requested aid types
// @route   GET /api/v1/admin/analytics/summary
// @access  Private (Admin)
export const getAidTypeSummary = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT aid_type, COUNT(*) as request_count FROM aid_requests GROUP BY aid_type ORDER BY request_count DESC'
        );
        res.status(200).json({
            status: 'success',
            data: rows,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};

// @desc    Find donor resources that match a specific aid request by type and location
// @route   GET /api/v1/admin/requests/:id/matches
// @access  Private (Admin)
export const findMatchingResources = async (req, res) => {
    try {
        const { id } = req.params;
        const radius = req.query.radius || 50; // Default radius of 50km

        // First, get the aid request details (type and location)
        const requestResult = await pool.query('SELECT aid_type, latitude, longitude FROM aid_requests WHERE id = $1', [id]);

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'No aid request found with that ID' });
        }
        const { aid_type, latitude: reqLat, longitude: reqLon } = requestResult.rows[0];

        if (!reqLat || !reqLon) {
            return res.status(400).json({ status: 'fail', message: 'The selected aid request does not have location data.' });
        }

        // Now, find all resources of the same type
        const resourceResult = await pool.query('SELECT * FROM resources WHERE resource_type = $1', [aid_type]);

        // Filter those resources by distance
        const nearbyResources = resourceResult.rows.filter(resource => {
            if (resource.latitude && resource.longitude) {
                const distance = getDistanceFromLatLonInKm(reqLat, reqLon, resource.latitude, resource.longitude);
                return distance <= radius;
            }
            return false;
        });

        res.status(200).json({
            status: 'success',
            count: nearbyResources.length,
            data: nearbyResources,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};
// ... other imports

// ... getAllUsers, updateUserRole, deleteUser, getAidTypeSummary, findMatchingResources functions ...

// @desc    Update the urgency of an aid request
// @route   PATCH /api/v1/admin/requests/:id/urgency
// @access  Private (Admin)
export const updateRequestUrgency = async (req, res) => {
    try {
        const { id } = req.params;
        const { urgency } = req.body;

        if (!urgency || !['low', 'medium', 'high'].includes(urgency)) {
            return res.status(400).json({ status: 'fail', message: 'Please provide a valid urgency level (low, medium, high).' });
        }

        const { rows } = await pool.query(
            'UPDATE aid_requests SET urgency = $1 WHERE id = $2 RETURNING *',
            [urgency, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'No aid request found with that ID' });
        }

        res.status(200).json({
            status: 'success',
            data: rows[0],
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};
export const deleteAidRequestbyadmin = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM aid_requests WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'fail', message: 'No aid request found with that ID' });
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};
export const getAllResources = async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT r.*, c.first_name, c.last_name, u.email
            FROM resources r
            JOIN users u ON r.donor_id = u.id
            JOIN contact_info c ON u.id = c.user_id
        `;
        const queryParams = [];
        if (search) {
            query += ` WHERE c.first_name ILIKE $1 OR c.last_name ILIKE $1 OR u.email ILIKE $1 OR r.resource_type ILIKE $1`;
            queryParams.push(`%${search}%`);
        }
        const { rows } = await pool.query(query, queryParams);
        res.status(200).json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// @desc    Admin: Update a resource
// @route   PATCH /api/v1/admin/resources/:id
// @access  Private (Admin)
export const updateResourceByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { resource_type, quantity } = req.body;
        const { rows } = await pool.query(
            'UPDATE resources SET resource_type = $1, quantity = $2 WHERE id = $3 RETURNING *',
            [resource_type, quantity, id]
        );
        if (rows.length === 0) return res.status(404).json({ status: 'fail', message: 'Resource not found.' });
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// @desc    Admin: Delete a resource
// @route   DELETE /api/v1/admin/resources/:id
// @access  Private (Admin)
export const deleteResourceByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM resources WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ status: 'fail', message: 'Resource not found.' });
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
// @desc    Get platform-wide statistics
// @route   GET /api/v1/admin/stats
// @access  Private (Admin)
export const getPlatformStats = async (req, res) => {
    try {
       const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM aid_requests) AS total_requests,
                (SELECT COUNT(*) FROM resources) AS total_resources,
                (SELECT COUNT(*) FROM matches WHERE status = 'pending') AS pending_matches,
                (SELECT json_agg(t) FROM (
                    SELECT aid_type, COUNT(*) as count 
                    FROM aid_requests 
                    GROUP BY aid_type 
                    ORDER BY count DESC 
                    LIMIT 5
                ) t) as top_requests,
                -- ADD THIS NEW PART --
                (SELECT json_agg(s) FROM (
                    SELECT status, COUNT(*) as count
                    FROM aid_requests
                    GROUP BY status
                ) s) as status_breakdown;
        `;
        const { rows } = await pool.query(statsQuery);
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
export const updateAidRequestByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { aid_type } = req.body;
        if (!aid_type) {
            return res.status(400).json({ status: 'fail', message: 'Aid type is required.' });
        }
        const { rows } = await pool.query(
            'UPDATE aid_requests SET aid_type = $1 WHERE id = $2 RETURNING *',
            [aid_type, id]
        );
        if (rows.length === 0) return res.status(404).json({ status: 'fail', message: 'Aid request not found.' });
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};