import pool from '../config/db.js';
import { getDistanceFromLatLonInKm } from '../utils/geolocation.js';

// @desc    Automatically find and suggest new matches
// @route   POST /api/v1/matches/find
// @access  Private (Admin)
export const findNewMatches = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Find all pending aid requests
        const { rows: pendingRequests } = await client.query("SELECT * FROM aid_requests WHERE status = 'pending'");
        
        let newMatchesFound = 0;
        for (const request of pendingRequests) {
            // Find resources of the same type within a 50km radius
            const { rows: availableResources } = await client.query("SELECT * FROM resources WHERE resource_type = $1", [request.aid_type]);

            for (const resource of availableResources) {
                const distance = getDistanceFromLatLonInKm(request.latitude, request.longitude, resource.latitude, resource.longitude);
                if (distance <= 50) {
                    // Insert a new match if it doesn't already exist
                    const result = await client.query(
                        `INSERT INTO matches (request_id, resource_id) VALUES ($1, $2) ON CONFLICT (request_id, resource_id) DO NOTHING RETURNING id`,
                        [request.id, resource.id]
                    );
                    if (result.rowCount > 0) {
                        newMatchesFound++;
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ status: 'success', message: `${newMatchesFound} new potential matches found.` });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ status: 'error', message: err.message });
    } finally {
        client.release();
    }
};

// @desc    Get all pending matches
// @route   GET /api/v1/matches/pending
// @access  Private (Admin)
export const getPendingMatches = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                m.id as match_id,
                r.id as request_id, r.aid_type,
                res.id as resource_id,
                u_req.email as requester_email,
                u_don.email as donor_email
            FROM matches m
            JOIN aid_requests r ON m.request_id = r.id
            JOIN resources res ON m.resource_id = res.id
            JOIN users u_req ON r.requester_id = u_req.id
            JOIN users u_don ON res.donor_id = u_don.id
            WHERE m.status = 'pending'
        `);
        res.status(200).json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// @desc    Confirm a match and assign a volunteer
// @route   POST /api/v1/matches/:id/confirm
// @access  Private (Admin)
export const confirmMatchAndAssign = async (req, res) => {
    const { id: matchId } = req.params;
    const { volunteerId } = req.body;
    const adminId = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Update the match status to 'confirmed'
        const { rows: matchRows } = await client.query("UPDATE matches SET status = 'confirmed' WHERE id = $1 RETURNING request_id", [matchId]);
        const { request_id } = matchRows[0];

        // 2. Update the aid request status to 'assigned'
        await client.query("UPDATE aid_requests SET status = 'assigned' WHERE id = $1", [request_id]);

        // 3. Create the assignment
        await client.query(
            'INSERT INTO assignments (request_id, volunteer_id, assigned_by_admin_id) VALUES ($1, $2, $3)',
            [request_id, volunteerId, adminId]
        );

        await client.query('COMMIT');
        res.status(200).json({ status: 'success', message: 'Match confirmed and volunteer assigned.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ status: 'error', message: err.message });
    } finally {
        client.release();
    }
};