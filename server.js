require('dotenv').config();
var fs = require('fs');
var https = require('https');
var privateKey  = fs.readFileSync('/etc/letsencrypt/live/adsoft.stone-guitar-picks.com/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/adsoft.stone-guitar-picks.com/fullchain.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};
const express = require('express');
const app = express();
// serve up production assets
app.use(express.static('build'));
// let the react app to handle any unknown routes 
// serve up the index.html if express does'nt recognize the route
const path = require('path');
app.get('*', (req, res) => {
res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});
// if not in production use the port 4005
const PORT = process.env.PORT || 4005;
console.log('server started on port:',PORT);

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(PORT);

//app.listen(PORT);
