import express from 'express';
import pool from './db/database_es.js';
import type { Expense, Group, Individual } from './types/types.ts'

const app = express();
app.use(express.json()); // parse into JSON

// Test PostgreSQL connection
app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT NOW() AS current_time`
        );

        res.status(200).json({
            message: 'Database connected successfully!',
            time: result.rows[0].current_time,
        })

    } catch (error) {
        console.error('Database connection failed: ', error);

        res.status(500).json({
            error: 'Failed to connect to database.'
        });
    }
})

// Homepage
app.get('/', (req, res) => {
    res.send('Home Page')
})

// Shared helper to cut repetition
function parseId(raw: string): number | null {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Expenses
app.get('/expense', async (req, res) => {
    try {
        // type of data to expect in each row.
        const result = await pool.query<Expense>(`
            SELECT * FROM expenses
            ORDER BY expenses.id
        `)

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Can not retrive expeses table: ', error);

        res.status(500).json({
            error: 'Failed to retrive expenses table.'
        });
    }
});

// Create a new expense
app.post('/expense', async (req, res) => {
    const { group_id, title, detail, amount, created_by } = req.body;

    if (typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ error: 'title is required.' });
        return;
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        res.status(400).json({ error: 'amount must be a number.' });
        return;
    }

    try {
        const result = await pool.query<Expense>(`
            INSERT INTO expenses (group_id, title, detail, amount, created_by)
            VALUES ($1, $2, $3, $4, $5)  
            RETURNING *`,
            [group_id, title.trim(), detail, amount, created_by]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23503') {
            res.status(400).json({ error: 'Invalid group_id or created_by.' });
            return;
        }

        console.error('Can not create a new expense: ', error);
        res.status(500).json({
            error: 'Failed to create a new expense.'
        });
    }
})

// Update an expense
app.put('/expense/:id', async (req, res) => {
    const { group_id, title, detail, amount, created_by } = req.body;
    const id = parseId(req.params.id);

    if (id === null) {
        res.status(400).json({
            error: 'Invalid expense  ID.',
        });
        return;
    }

    if (typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ error: 'title is required.' });
        return;
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        res.status(400).json({ error: 'amount must be a number.' });
        return;
    }

    try {
        const result = await pool.query<Expense>(
            `
            UPDATE expenses
            SET group_id = $1,
                title = $2,
                detail = $3,
                amount = $4,
                created_by = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
            `,
            [group_id, title.trim(), detail, amount, created_by, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                error: 'Expense not found.',
            });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23503') {
            res.status(400).json({ error: 'Invalid group_id or created_by.' });
            return;
        }

        console.error('Cannot update expense:', error);
        res.status(500).json({
            error: 'Failed to update expense.',
        });
    }
});

// Delete an expense
app.delete('/expense/:id', async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
        res.status(400).json({ error: 'Invalid expense ID.' })
        return;
    }

    try {
        const result = await pool.query(`DELETE FROM expenses WHERE id = $1`, [id])

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expense not found.' });
            return;
        }

        res.status(200).json({ message: 'Deleted successfully.' })
    } catch (error) {
        console.error('Cannot delete expense:', error);
        res.status(500).json({ error: 'Failed to delete expense.' });
    }
})

/*-------------------------------------------------------------------------------------------*/
// Groups
app.get('/group', async (req, res) => {
    try {
        const result = await pool.query<Group>(`
            SELECT * FROM groups
            ORDER BY groups.id
        `)

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Can not retrive groups table: ', error);

        res.status(500).json({
            error: 'Failed to retrive groups table.'
        });
    }
});

// Create a new group
app.post('/group', async (req, res) => {
    const { name } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'name is required' })
        return;
    }

    try {
        const result = await pool.query<Group>(`
            INSERT INTO groups (name)
            VALUES ($1)  
            RETURNING *
        `, [name.trim()]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Can not create a new group: ', error);
        res.status(500).json({
            error: 'Failed to create a new group.'
        });
    }
})

// Update a group
app.put('/group/:id', async (req, res) => {
    const { name } = req.body;
    const id = parseId(req.params.id);

    if (id === null) {
        res.status(400).json({
            error: 'Invalid group ID.',
        });
        return;
    }

    if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'name is required.' });
        return;
    }

    try {
        const result = await pool.query<Group>(
            `
            UPDATE groups
            SET name = $1
            WHERE id = $2
            RETURNING *
        `, [name.trim(), id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                error: 'Group not found.',
            });
            return;
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Cannot update group:', error);
        res.status(500).json({
            error: 'Failed to update group.',
        });
    }
});

// Delete a group
app.delete('/group/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        res.status(400).json({
            error: 'Invalid group ID.',
        });
        return;
    }

    try {
        const result = await pool.query(`
            DELETE FROM groups
            WHERE id = $1
        `, [id])

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Group not found.' })
            return;
        }

        res.status(200).json({
            message: 'Deleted successfully.'
        })
    } catch (error: any) {
        if (error.code === '23503') {
            res.status(409).json({ error: 'Group still has expenses.' })
            return;
        }

        console.error('Cannot delete group:', error);
        res.status(500).json({
            error: 'Failed to delete group.',
        });
    }
})

/*-------------------------------------------------------------------------------------------*/
// Individuals
app.get('/individual', async (req, res) => {
    try {
        const result = await pool.query<Individual>(`
            SELECT * FROM individuals
            ORDER BY individuals.id
        `)

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Can not retrive in individual table: ', error);

        res.status(500).json({
            error: 'Failed to retrive individual table.'
        });
    }
});

// Create a new individual
app.post('/individual', async (req, res) => {
    const { name, gender } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'name is required.' });
        return;
    }

    try {
        const result = await pool.query<Individual>(`
            INSERT INTO individuals (name, gender)
            VALUES ($1, $2)  
            RETURNING *
        `, [name.trim(), gender]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Can not create a new individual: ', error);
        res.status(500).json({
            error: 'Failed to create a new individual.'
        });
    }
})

// Update a individual
app.put('/individual/:id', async (req, res) => {
    const { name, gender } = req.body;
    const id = parseId(req.params.id);

    if (id === null) {
        res.status(400).json({
            error: 'Invalid individual ID.',
        });
        return;
    }

    if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'name is required.' });
        return;
    }

    try {
        const result = await pool.query<Individual>(
            `
            UPDATE individuals
            SET name = $1,
                gender = $2
            WHERE id = $3
            RETURNING *
        `, [name.trim(), gender, id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                error: 'individual not found.',
            });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Cannot update individual:', error);
        res.status(500).json({
            error: 'Failed to update individual.',
        });
    }
});

// Delete a group
app.delete('/individual/:id', async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
        res.status(400).json({
            error: 'Invalid individual ID.',
        });
        return;
    }

    try {
        const result = await pool.query(`
            DELETE FROM individuals
            WHERE id = $1
        `, [id])

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Individual not found' })
            return;
        }

        res.status(200).json({
            message: 'Deleted successfully.'
        })
    } catch (error: any) {
        if (error.code === '23503') {
            res.status(409).json({ error: 'Individual still has expenses.' });
            return;
        }

        console.error('Cannot delete individual:', error);
        res.status(500).json({
            error: 'Failed to delete individual.',
        });
    }
})

// 404 handler — keep it after your routes
app.use((req, res) => {
    res.status(404).json({
        error: 'URL does not exist.',
    });
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});