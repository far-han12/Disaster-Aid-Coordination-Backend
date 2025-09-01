import pool from '../config/db.js';

// ... existing assignVolunteerToRequest function ...
export const assignVolunteerToRequest = async (req, res) => {
    // ...
};


// @desc    Get all assignments for the logged-in volunteer
// @route   GET /api/v1/assignments/my-assignments
// @access  Private (Volunteer)
// ... existing assignVolunteerToRequest function ...

// @desc    Get all assignments for the logged-in volunteer with full details
// @route   GET /api/v1/assignments/my-assignments
// @access  Private (Volunteer)
export const getMyAssignments = async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const query = `
            SELECT 
                a.id AS assignment_id,
                r.aid_type,
                r.status AS request_status,
                
                -- Requester Details
                req_ci.first_name AS requester_first_name,
                req_ci.last_name AS requester_last_name,
                req_ci.phone_no AS requester_phone,
                req_ci.street AS requester_street,
                req_ci.city AS requester_city,
                
                -- Donor Details
                don_ci.first_name AS donor_first_name,
                don_ci.last_name AS donor_last_name,
                don_ci.phone_no AS donor_phone,
                don_ci.street AS donor_street,
                don_ci.city AS donor_city

            FROM assignments a
            JOIN aid_requests r ON a.request_id = r.id
            JOIN contact_info req_ci ON r.requester_id = req_ci.user_id
            
            -- Find the confirmed match to link to the resource and donor
            JOIN matches m ON r.id = m.request_id AND m.status = 'confirmed'
            JOIN resources res ON m.resource_id = res.id
            JOIN contact_info don_ci ON res.donor_id = don_ci.user_id

            WHERE a.volunteer_id = $1
            ORDER BY a.assignment_date DESC
        `;
        
        const { rows } = await pool.query(query, [volunteerId]);

        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
// @desc    Volunteer marks an assignment as complete
// @route   PATCH /api/v1/assignments/:id/complete
// @access  Private (Volunteer)
export const markAssignmentAsComplete = async (req, res) => {
    const { id: assignmentId } = req.params;
    const volunteerId = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verify that the logged-in volunteer is assigned to this task
        const assignmentCheck = await client.query(
            'SELECT request_id FROM assignments WHERE id = $1 AND volunteer_id = $2',
            [assignmentId, volunteerId]
        );

        if (assignmentCheck.rows.length === 0) {
            return res.status(403).json({ status: 'fail', message: 'You are not authorized to complete this task.' });
        }
        const { request_id } = assignmentCheck.rows[0];

        // 2. Update the aid_requests table status to 'fulfilled'
        await client.query(
            "UPDATE aid_requests SET status = 'fulfilled' WHERE id = $1",
            [request_id]
        );

        await client.query('COMMIT');
        res.status(200).json({ status: 'success', message: 'Task marked as completed.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ status: 'error', message: err.message });
    } finally {
        client.release();
    }
};