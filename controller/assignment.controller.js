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