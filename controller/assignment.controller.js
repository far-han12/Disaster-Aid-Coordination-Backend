import pool from '../config/db.js';

// @desc    Assign a volunteer to an aid request
// @route   POST /api/v1/assignments
// @access  Private (Admin)
export const assignVolunteerToRequest = async (req, res) => {
    try {
        const { requestId, volunteerId } = req.body;
        const adminId = req.user.id; // The logged-in admin

        if (!requestId || !volunteerId) {
            return res.status(400).json({ status: 'fail', message: 'Please provide a requestId and a volunteerId.' });
        }

        // Optional: Verify the user being assigned is actually a volunteer
        const volunteerCheck = await pool.query('SELECT role FROM users WHERE id = $1', [volunteerId]);
        if (volunteerCheck.rows.length === 0 || volunteerCheck.rows[0].role !== 'volunteer') {
            return res.status(400).json({ status: 'fail', message: 'The specified user is not a volunteer.' });
        }

        const { rows } = await pool.query(
            'INSERT INTO assignments (request_id, volunteer_id, assigned_by_admin_id) VALUES ($1, $2, $3) RETURNING *',
            [requestId, volunteerId, adminId]
        );

        // Also update the aid_requests table status to 'assigned'
        await pool.query('UPDATE aid_requests SET status = $1 WHERE id = $2', ['assigned', requestId]);

        res.status(201).json({
            status: 'success',
            data: {
                assignment: rows[0],
            },
        });
    } catch (err) {
        // Handle potential unique constraint violation (volunteer already assigned)
        if (err.code === '23505') {
            return res.status(409).json({ status: 'fail', message: 'This volunteer is already assigned to this request.' });
        }
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};
