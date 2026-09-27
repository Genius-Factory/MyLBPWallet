require('dotenv').config();
const { createApp } = require('./app');
const PORT = process.env.PORT || 4000;
createApp().listen(PORT, () => console.log(`Server running on port ${PORT}`));