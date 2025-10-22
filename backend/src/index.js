import dotenv from 'dotenv';
// Make sure this is a DEFAULT import (no curly braces)
import pool from './config/db.js'; 
import { app } from './app.js';
import { initDb } from './config/initDb.js';

dotenv.config({
    path: './.env'
});

const PORT = process.env.PORT || 8000;

pool.query('SELECT NOW()')
    .then(() => {
        console.log('PostgreSQL connected successfully!');
        initDb();
        
        // Start the server ONLY after a successful DB connection
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port: ${PORT}`);
        });
    })
    .catch(err => {
        // This will catch any errors from the initial pool.query()
        console.error('❌ Database connection failed. Server will not start.', err);
        process.exit(1); // Exit the process with an error code
    });

