import express from 'express';

const app = express();

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