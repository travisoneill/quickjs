'use strict';

const http = require('http');
const https = require('https');
const apiKey = require('./keys');
const port = process.env.PORT || 8000;

const handler = (req, res) => {
  const query = (req.url.match(/\?.*$/) || [])[0];
  if (!req.url.match(/^\/api/)) {
    res.end('Invalid Path');
  }
  if (!query) {
    res.end('No Query');
  }
  // console.log(query);
  const url = 'https://travisoneill.github.io/quickjs' + query;
  shortenerAPICall(url, handleResponse);
  res.writeHead('Access-Control-Allow-Origin', '*');
  res.end(req.url);
}

const shortenerAPICall = (longUrl, callback) => {
  const postData = JSON.stringify({ longUrl, });
  const headers = {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(postData),
  }

  const options = {
    hostname: 'www.googleapis.com',
    port: 80,
    path: `/urlshortener/v1/url?key=${apiKey}`,
    method: 'POST',
    headers: headers,
  }

  const req = http.request(options, callback)
  req.write(postData);
  req.end();
}

const handleResponse = res => {
  let string = '';
  res.on('data', chunk => {
    string += chunk;
  });
  res.on('end', () => {
    console.log(JSON.parse(string));
  });
}

const server = http.createServer(handler);

if (module === require.main) {
  server.listen(port, () => console.log(`Quickjs API listening on port ${port}`));
}


// const Express = require('express');
// const apiKey = require('./keys');
// const app = Express();
//
// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });
//
// app.get('/api', (req, res) => {
//   res.send(req);
// });
//
