import express from 'express';
import pool from './db/database_es.js';

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
    res.status(200).send('Expenses Sharing');
});

// 404 handler — keep it after your routes
app.use((req, res) => {
    res.status(404).json({
        error: 'URL does not exist.',
    });
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});