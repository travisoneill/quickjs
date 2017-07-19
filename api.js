'use strict';

const http = require('http');
const https = require('https');
const apiKey = require('./keys');
const port = process.env.PORT || 8000;

const endpoint = (req, res) => {
  const query = (req.url.match(/\?.*$/) || [])[0];
  if (!req.url.match(/^\/api/)) {
    res.end('Invalid Path');
  }
  if (!query) {
    res.end('No Query');
  }

  // res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const returnRes = responseHandler(data => {
    res.writeHead(200, { 'Content-Type': 'application/JSON' });
    res.end(JSON.stringify(data));
  });
  const url = `https://travisoneill.github.io/quickjs${query}`;

  shortenerAPICall(url, returnRes);
}

const shortenerAPICall = (longUrl, callback) => {
  const postData = JSON.stringify({ longUrl, });
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  }

  const options = {
    hostname: 'www.googleapis.com',
    path: `/urlshortener/v1/url?key=${apiKey}`,
    method: 'POST',
    headers: headers,
  }

  const req = https.request(options, callback);
  req.write(postData);
  req.end();
}

const responseHandler = callback => {

  const _handler = res => {
    let string = '';
    res.on('data', chunk => {
      string += chunk;
    });
    res.on('end', () => {
      callback(string);
    });
  };

  return _handler;

}

const server = http.createServer(endpoint);

if (module === require.main) {
  server.listen(port, () => console.log(`Quickjs API listening on port ${port}`));
}
