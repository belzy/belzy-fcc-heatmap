const path = require('path');
const express = require('express');
const server = express();
const PORT = process.env.PORT || 8080;

server.use(express.static(path.join(__dirname, './client')));

server.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './client.index.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});