// Star Wars Characters API, modelled on the shape of vpnapi.io:
//   GET /api/characters/{id}?key=YOUR_API_KEY   -> one character
//   GET /api/characters?key=YOUR_API_KEY        -> list (with optional filters)
//   GET /                                       -> documentation page
// Uses only Node's built-in modules (no dependencies).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { movies, characters, AFFILIATIONS, plans, apiKeys } = require('./data');

const PORT = process.env.PORT || 3000;
const docsPage = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));

// ---------- helpers ----------

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function sendError(res, status, error, message, extra = {}) {
  sendJson(res, status, { error, message, ...extra });
}

// Turns the compact stored record into the public, sectioned response.
function toResponse(c) {
  const films = c.movies.map((ep) => movies[ep]);
  const first = films.reduce((a, b) => (b.release_year < a.release_year ? b : a));
  return {
    id: c.id,
    name: c.name,
    affiliation: Object.fromEntries(AFFILIATIONS.map((a) => [a, c.affiliations.includes(a)])),
    biography: c.biography,
    appearances: {
      movies: films,
      movie_count: films.length,
      first_appearance: first.title,
      trilogies: [...new Set(films.map((f) => f.trilogy))],
    },
  };
}

// ---------- rate limiting (in memory, resets at 00:00 UTC like vpnapi.io) ----------

const usage = new Map(); // key -> { day: 'YYYY-MM-DD', count }

function consumeRequest(key, plan) {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  let u = usage.get(key);
  if (!u || u.day !== day) {
    u = { day, count: 0 };
    usage.set(key, u);
  }
  const limited = u.count >= plan.dailyLimit;
  if (!limited) u.count++;
  const resetMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return {
    limited,
    limit: plan.dailyLimit,
    remaining: plan.dailyLimit - u.count,
    reset: Math.floor(resetMs / 1000),
    retryAfter: Math.ceil((resetMs - now.getTime()) / 1000),
  };
}

// ---------- list filters ----------

// Returns { results } or { error } for a bad filter value.
function filterCharacters(params) {
  let results = characters;

  const name = params.get('name');
  if (name) {
    const q = name.toLowerCase();
    results = results.filter((c) => c.name.toLowerCase().includes(q));
  }

  const movie = params.get('movie');
  if (movie !== null) {
    const ep = Number(movie);
    if (!movies[ep]) return { error: `"movie" must be an episode number from 1 to 9.` };
    results = results.filter((c) => c.movies.includes(ep));
  }

  const affiliation = params.get('affiliation');
  if (affiliation !== null) {
    if (!AFFILIATIONS.includes(affiliation)) {
      return { error: `"affiliation" must be one of: ${AFFILIATIONS.join(', ')}.` };
    }
    results = results.filter((c) => c.affiliations.includes(affiliation));
  }

  return { results };
}

// ---------- request handling ----------

function handleApi(req, res, url, id) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'Method Not Allowed', 'This endpoint only supports GET.');
  }

  // 1. Authenticate with the ?key= query parameter.
  const key = url.searchParams.get('key');
  if (!key) return sendError(res, 401, 'Unauthorized', 'Missing API key. Add ?key=YOUR_API_KEY to the URL.');
  const plan = plans[apiKeys[key]];
  if (!plan) return sendError(res, 401, 'Unauthorized', 'Invalid API key.');

  // 2. Apply the plan's daily limit. Every authenticated request counts.
  const rate = consumeRequest(key, plan);
  res.setHeader('X-RateLimit-Limit', rate.limit);
  res.setHeader('X-RateLimit-Remaining', rate.remaining);
  res.setHeader('X-RateLimit-Reset', rate.reset);
  if (rate.limited) {
    res.setHeader('Retry-After', rate.retryAfter);
    return sendError(res, 429, 'Too Many Requests',
      `Daily limit of ${rate.limit} requests reached for the ${plan.name} plan. Resets at 00:00 UTC.`);
  }

  // 3a. Single character.
  if (id) {
    const c = characters.find((ch) => ch.id === id.toLowerCase());
    if (!c) return sendError(res, 404, 'Not Found', `No character with id "${id}".`);
    return sendJson(res, 200, toResponse(c));
  }

  // 3b. List, with optional filters.
  const { results, error } = filterCharacters(url.searchParams);
  if (error) return sendError(res, 400, 'Bad Request', error);
  sendJson(res, 200, { count: results.length, results: results.map(toResponse) });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (pathname === '/') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return sendError(res, 405, 'Method Not Allowed', 'This page only supports GET.');
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(docsPage);
  }

  // Matches /api/characters and /api/characters/{id} (trailing slash allowed).
  const match = pathname.match(/^\/api\/characters(?:\/([^/]+))?\/?$/);
  if (match) {
    let id = match[1];
    try {
      id = id && decodeURIComponent(id);
    } catch {
      return sendError(res, 400, 'Bad Request', 'The character id is not valid URL encoding.');
    }
    return handleApi(req, res, url, id);
  }

  sendError(res, 404, 'Not Found', `No route matches ${pathname}.`, { path: pathname });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
