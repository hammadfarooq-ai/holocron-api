<div align="center">

# ⁂ Holocron API ⁂

**A zero-dependency Node.js archive of Star Wars characters and the films they appear in.**

*API keys, sectioned JSON responses, daily rate limits, and a reference manual styled like a classical printed book.*

![Node.js 18+](https://img.shields.io/badge/node-%E2%89%A518-3c873a)
![Dependencies: 0](https://img.shields.io/badge/dependencies-0-7b1e1e)
![Data: mocked](https://img.shields.io/badge/data-mocked-9c7a2e)

</div>

---

## Contents

1. [About](#about)
2. [Quick start](#quick-start)
3. [Endpoints](#endpoints)
4. [Anatomy of a response](#anatomy-of-a-response)
5. [Keys and rate limits](#keys-and-rate-limits)
6. [Errors](#errors)
7. [Manual test checklist](#manual-test-checklist)
8. [Project layout](#project-layout)
9. [Design decisions](#design-decisions)

---

## About

I built Holocron API as a take-home technical assessment for a hiring process. The brief was a small Node.js HTTP endpoint at `GET /characters` that returns mocked Star Wars characters, each with a name and the movies they appear in. The brief also asked for:

- a minimal implementation with the design explained
- instructions for running and manually testing the server
- a sensible response for unknown routes

After the minimal version was working, I extended it to follow the conventions of a real commercial lookup API ([vpnapi.io](https://vpnapi.io/api-documentation)):

- the lookup id goes in the URL path
- an API key goes in the `?key=` parameter
- responses are grouped into named sections
- usage is capped per plan, with a daily reset at 00:00 UTC

A holocron is the archive device of the Star Wars universe, and this project is a small one.

## Quick start

You need Node.js 18 or newer. There is nothing to install.

```bash
git clone https://github.com/hammadfarooq-ai/holocron-api.git
```
```bash
cd holocron-api
```
```bash
npm start
```

Then open **http://localhost:3000** for the reference manual, which includes a live request console. Set `PORT` to use a different port.

## Endpoints

| Method & path | What it returns |
| --- | --- |
| `GET /` | The reference manual (HTML) |
| `GET /api/characters/{id}?key=KEY` | One character |
| `GET /api/characters?key=KEY` | `{ "count": n, "results": [...] }` |

Ids are lowercase names joined by hyphens, such as `luke-skywalker`, `darth-vader` or `r2-d2`.

The list endpoint accepts filters, which you can combine:

| Filter | Matches | Example |
| --- | --- | --- |
| `name` | Name contains this text (case-insensitive) | `?name=sky` |
| `movie` | Appears in this episode (1–9) | `?movie=4` |
| `affiliation` | Belongs to this faction | `?affiliation=jedi` |

## Anatomy of a response

`GET /api/characters/luke-skywalker?key=demo-free-key`

```jsonc
{
  "id": "luke-skywalker",
  "name": "Luke Skywalker",

  // Faction flags: true / false for each, a character can hold several
  "affiliation": {
    "jedi": true, "sith": false, "republic": false, "rebellion": true,
    "empire": false, "resistance": true, "first_order": false
  },

  // Who they are
  "biography": {
    "species": "Human", "gender": "Male", "homeworld": "Tatooine",
    "birth_year": "19BBY", "height_cm": 172, "mass_kg": 77
  },

  // Where they appear (movies shortened here)
  "appearances": {
    "movies": [
      { "episode": 4, "title": "A New Hope", "release_year": 1977, "trilogy": "Original" }
    ],
    "movie_count": 7,
    "first_appearance": "A New Hope",
    "trilogies": ["Prequel", "Original", "Sequel"]
  }
}
```

The archive holds 13 characters across all nine Skywalker saga films.

## Keys and rate limits

| Demo key | Plan | Requests per day |
| --- | --- | ---: |
| `demo-trial-key` | Trial | 5 |
| `demo-free-key` | Free | 1,000 |
| `demo-basic-key` | Basic | 10,000 |
| `demo-premium-key` | Premium | 50,000 |

Every request with a valid key counts toward the limit, and every response reports where the key stands:

| Header | Meaning |
| --- | --- |
| `X-RateLimit-Limit` | The key's daily allowance |
| `X-RateLimit-Remaining` | Requests left today |
| `X-RateLimit-Reset` | When the count resets (Unix seconds, 00:00 UTC) |
| `Retry-After` | Seconds until the reset (sent only with a 429) |

The trial key's tiny allowance is there so you can see a `429` after a handful of requests.

## Errors

Every error uses the same JSON shape:

```json
{ "error": "Not Found", "message": "No route matches /api/planets.", "path": "/api/planets" }
```

| Status | When |
| --- | --- |
| `400` | A filter value isn't allowed (for example `movie=12`), or the id is malformed URL encoding |
| `401` | The key is missing or unknown |
| `404` | No character has that id, or no route matches the path (the response also echoes `path`) |
| `405` | A method other than GET was used (the `Allow: GET` header is set) |
| `429` | The key's daily allowance is used up |

## Manual test checklist

The quickest way is the **Console** section of http://localhost:3000. Its preset links send each of these requests. With curl (in Windows PowerShell, type `curl.exe`):

```bash
curl -i "http://localhost:3000/api/characters/darth-vader?key=demo-free-key"
```
```bash
curl -i "http://localhost:3000/api/characters?movie=4&affiliation=rebellion&key=demo-free-key"
```
```bash
curl -i "http://localhost:3000/api/planets"
```

| Request | Expected |
| --- | --- |
| A character id with a valid key | `200` and the character |
| A list with filters | `200` and `{ count, results }` |
| No `key` / `key=bogus` | `401` |
| `/api/characters/jar-jar?key=demo-free-key` | `404`, unknown character |
| `/api/planets` | `404`, unknown route, with `path` echoed |
| `?movie=12` or `?affiliation=hutt` | `400`, lists the allowed values |
| `POST /api/characters?key=demo-free-key` | `405`, `Allow: GET` |
| 6 requests with `demo-trial-key` | 5 × `200`, then `429` |

## Project layout

```
holocron-api/
├── server.js          routing, key check, rate limiting, response shaping
├── data.js            mocked films, characters, plans and demo keys
├── public/
│   └── index.html     the reference manual and live console
└── package.json       one script: npm start
```

## Design decisions

**Node's built-in `http` module, no framework.** Three routes and one regex don't justify Express. With zero dependencies, there's nothing to install, audit or keep updated.

**Storage is separate from presentation.** `data.js` keeps each character compact, with films stored as episode numbers. `toResponse()` in `server.js` expands them into the public shape and computes `movie_count`, `first_appearance` and `trilogies` on every request. Derived values can't fall out of sync with the data.

**Sectioned responses.** Grouping fields into `affiliation`, `biography` and `appearances` mirrors how vpnapi.io groups `security`, `location` and `network`. Clients can read just the part they need, and new fields have an obvious home.

**Lists are wrapped as `{ count, results }`.** Once filters exist, a count is useful, and the wrapper leaves room for pagination later without a breaking change.

**Keys and limits are checked before any lookup.** A request with a bad key never touches the data. Every authenticated request counts toward the limit, even a 404, which matches how metered APIs usually bill.

**Rate limits are kept in memory.** A `Map` from key to today's count resets on a new UTC day. That's enough for a mock. A real deployment would keep the counts in shared storage such as Redis so they survive restarts and work across instances.

**The API key goes in the query string.** It follows the vpnapi.io convention. A production API would more often take an `Authorization` header, because URLs end up in logs and browser history.

**One error shape everywhere.** The status code says what went wrong and `message` says how to fix it. Unknown routes return a JSON `404` with the requested path, and malformed URL encoding returns a `400` instead of crashing the process.

**The manual can't go stale.** The reference page fetches its example response and its character archive from the running API. Its classical styling comes from Garamond type, a parchment palette, roman-numeral sections and book-style ruled tables. It switches to a dark variant when the system is in dark mode.

---

<div align="center"><sub>All character data is mocked for demonstration. Star Wars is a trademark of Lucasfilm Ltd.; this project is unaffiliated.</sub></div>
