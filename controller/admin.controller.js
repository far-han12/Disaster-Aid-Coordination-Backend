import pool from '../config/db.js';

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, email, role FROM users ORDER BY id ASC');
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

// @desc    Find donor resources that match a specific aid request
// @route   GET /api/v1/admin/requests/:id/matches
// @access  Private (Admin)
export const findMatchingResources = async (req, res) => {
    try {
        const { id } = req.params;

        // First, get the aid type of the request
        const requestResult = await pool.query('SELECT aid_type FROM aid_requests WHERE id = $1', [id]);

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'No aid request found with that ID' });
        }
        const { aid_type } = requestResult.rows[0];

        // Now, find all resources of that type
        const { rows } = await pool.query('SELECT * FROM resources WHERE resource_type = $1', [aid_type]);

        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};
