const express = require('express');   
const dbConnect = require('./database/index');
const app = express();    
const { PORT } = require('./config/index');  // Ensure PORT is correctly defined
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');
const router = require('./routes/index');

// Middleware (Order Matters!)
app.use(express.json()); // Parse JSON requests
app.use(cookieParser()); // Parse cookies

// Use Router
app.use(router);  

// Connect to Database
dbConnect();

app.use('/storage',express.static('storage'));
// Error Handling Middleware (should be at the end)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => console.log(`The backend is running on: ${PORT}`));
