import pool from '../config/db.js';
import { getDistanceFromLatLonInKm } from '../utils/geolocation.js';

// @desc    Automatically find and suggest new matches
// @route   POST /api/v1/matches/find
// @access  Private (Admin)
export const findNewMatches = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Find all pending aid requests with a quantity greater than 0
        const { rows: pendingRequests } = await client.query("SELECT * FROM aid_requests WHERE status = 'pending' AND quantity > 0");
        
        let newMatchesFound = 0;
        for (const request of pendingRequests) {
            // Find available resources of the same type with quantity greater than 0
            const { rows: availableResources } = await client.query(
                "SELECT * FROM resources WHERE resource_type = $1 AND quantity > 0", 
                [request.aid_type]
            );

            for (const resource of availableResources) {
                const distance = getDistanceFromLatLonInKm(request.latitude, request.longitude, resource.latitude, resource.longitude);
                if (distance <= 50) { // 50km radius
                    // Only match if the resource can contribute (i.e., its quantity is > 0)
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

// @desc    Get all pending matches with quantity details
// @route   GET /api/v1/matches/pending
// @access  Private (Admin)
export const getPendingMatches = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                m.id as match_id,
                r.id as request_id, 
                r.aid_type,
                r.quantity as requested_quantity,
                res.id as resource_id,
                res.quantity as available_quantity,
                u_req.email as requester_email,
                u_don.email as donor_email
            FROM matches m
            JOIN aid_requests r ON m.request_id = r.id
            JOIN resources res ON m.resource_id = res.id
            JOIN users u_req ON r.requester_id = u_req.id
            JOIN users u_don ON res.donor_id = u_don.id
            WHERE m.status = 'pending' AND r.quantity > 0 AND res.quantity > 0
        `);
        res.status(200).json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// @desc    Confirm a match, assign a volunteer, and update quantities
// @route   POST /api/v1/matches/:id/confirm
// @access  Private (Admin)
export const confirmMatchAndAssign = async (req, res) => {
    const { id: matchId } = req.params;
    const { volunteerId } = req.body;
    const adminId = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get match details
        const { rows: matchRows } = await client.query("SELECT request_id, resource_id FROM matches WHERE id = $1 AND status = 'pending'", [matchId]);
        if (matchRows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'No pending match found.' });
        }
        const { request_id, resource_id } = matchRows[0];

        // 2. Get current quantities
        const { rows: reqRows } = await client.query("SELECT quantity FROM aid_requests WHERE id = $1 FOR UPDATE", [request_id]);
        const requestedQuantity = reqRows[0].quantity;
        
        const { rows: resRows } = await client.query("SELECT quantity FROM resources WHERE id = $1 FOR UPDATE", [resource_id]);
        const availableQuantity = resRows[0].quantity;

        // 3. Determine the amount to transfer
        const transferQuantity = Math.min(requestedQuantity, availableQuantity);
        
        if (transferQuantity <= 0) {
            return res.status(400).json({ status: 'fail', message: 'Resource has no available quantity to fulfill this request.' });
        }

        // 4. Update quantities in the database
        const newResourceQuantity = availableQuantity - transferQuantity;
        const newRequestQuantity = requestedQuantity - transferQuantity;

        await client.query("UPDATE resources SET quantity = $1 WHERE id = $2", [newResourceQuantity, resource_id]);
        await client.query("UPDATE aid_requests SET quantity = $1 WHERE id = $2", [newRequestQuantity, request_id]);

        // 5. Update statuses
        await client.query("UPDATE matches SET status = 'confirmed' WHERE id = $1", [matchId]);
        
        // Only set request to 'assigned' if it's fully met
        if (newRequestQuantity === 0) {
            await client.query("UPDATE aid_requests SET status = 'assigned' WHERE id = $1", [request_id]);
        }
        
        // 6. Create the assignment for the transferred amount
        await client.query(
            'INSERT INTO assignments (request_id, volunteer_id, assigned_by_admin_id, quantity_assigned) VALUES ($1, $2, $3, $4)',
            [request_id, volunteerId, adminId, transferQuantity]
        );

        await client.query('COMMIT');
        res.status(200).json({ status: 'success', message: `Match confirmed. ${transferQuantity} units assigned.` });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ status: 'error', message: err.message });
    } finally {
        client.release();
    }
};

