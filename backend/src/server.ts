import express from 'express';
import pool from './db/database_es.js';
import type { Expense, Group } from './types/types.js'

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

// Expenses URL
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
            error: 'Failed to retrive expeses table.'
        });
    }
});

// Create a new expense
app.post('/expense', async (req, res) => {
    const { group_id, title, detail, amount, created_by } = req.body;

    try {
        const result = await pool.query<Expense>(`
            INSERT INTO expenses (group_id, title, detail, amount, created_by)
            VALUES ($1, $2, $3, $4, $5)  
            RETURNING *`,
            [group_id, title, detail, amount, created_by]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Can not create a new expense: ', error);

        res.status(500).json({
            error: 'Failed to create a new expense.'
        });
    }
})

// Update an expense
app.put('/expense/:id', async (req, res) => {
    const { group_id, title, detail, amount, created_by } = req.body;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
            error: 'Invalid expense ID.',
        });
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
            [group_id, title, detail, amount, created_by, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                error: 'Expense not found.',
            });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Cannot update expense:', error);

        res.status(500).json({
            error: 'Failed to update expense.',
        });
    }
});

// Delete an expense
app.delete('/expense/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
        const result = await pool.query(`
            DELETE FROM expenses
            WHERE id = ${id}
        `)

        res.status(200).json({
            message: 'Delete successfully.'
        })
    } catch (error) {
        console.error('Cannot delete expense:', error);

        res.status(500).json({
            error: 'Failed to delete expense.',
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