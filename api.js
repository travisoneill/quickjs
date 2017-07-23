'use strict';

const http = require('http');
const https = require('https');
const port = process.env.PORT || 8000;

const routes = (req, res) => {
  switch (true) {
    case /^\/api/.test(req.url):
      endpoint(req, res);
      break;
    case /^\/test/.test(req.url):
      console.log('Request Recieved');
      res.end('Request Recieved');
      break;
    default:
      res.end('Invalid Path');
  }
}

const endpoint = (req, res) => {
  const query = (req.url.match(/\?.*$/) || [])[0];
  if (!query) {
    res.end('No Query');
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  // res.setHeader('Content-Type', 'application/json');
  const returnShortenedURL = responseHandler(data => {
    res.writeHead(200, { 'Content-Type': 'application/JSON' });
    res.end(JSON.stringify(data));
  });

  const url = `https://travisoneill.github.io/quickjs/${query}`;
  shortenerAPICall(url, returnShortenedURL);
}

const shortenerAPICall = (longUrl, callback) => {
  const postData = JSON.stringify({ longUrl, });
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  }

  const options = {
    hostname: 'www.googleapis.com',
    path: `/urlshortener/v1/url?key=${process.env.API_GOOGL}`,
    method: 'POST',
    headers: headers,
  }

  const req = https.request(options, callback);
  req.write(postData);
  req.end();
}

// TODO: See if I can sed response as stream
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

const server = http.createServer(routes);

if (module === require.main) {
  server.listen(port, () => console.log(`Quickjs API listening on port ${port}`));
}
