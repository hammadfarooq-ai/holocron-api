// Mocked data. Everything lives in memory; nothing is read from disk or a database.

// Movies keyed by episode number, so characters can reference them compactly.
const movies = {
  1: { episode: 1, title: 'The Phantom Menace', release_year: 1999, trilogy: 'Prequel' },
  2: { episode: 2, title: 'Attack of the Clones', release_year: 2002, trilogy: 'Prequel' },
  3: { episode: 3, title: 'Revenge of the Sith', release_year: 2005, trilogy: 'Prequel' },
  4: { episode: 4, title: 'A New Hope', release_year: 1977, trilogy: 'Original' },
  5: { episode: 5, title: 'The Empire Strikes Back', release_year: 1980, trilogy: 'Original' },
  6: { episode: 6, title: 'Return of the Jedi', release_year: 1983, trilogy: 'Original' },
  7: { episode: 7, title: 'The Force Awakens', release_year: 2015, trilogy: 'Sequel' },
  8: { episode: 8, title: 'The Last Jedi', release_year: 2017, trilogy: 'Sequel' },
  9: { episode: 9, title: 'The Rise of Skywalker', release_year: 2019, trilogy: 'Sequel' },
};

// The affiliation flags every character response reports (like vpnapi's security flags).
const AFFILIATIONS = ['jedi', 'sith', 'republic', 'rebellion', 'empire', 'resistance', 'first_order'];

const bio = (species, gender, homeworld, birth_year, height_cm, mass_kg) =>
  ({ species, gender, homeworld, birth_year, height_cm, mass_kg });

const characters = [
  { id: 'luke-skywalker', name: 'Luke Skywalker', affiliations: ['jedi', 'rebellion', 'resistance'], biography: bio('Human', 'Male', 'Tatooine', '19BBY', 172, 77), movies: [3, 4, 5, 6, 7, 8, 9] },
  { id: 'leia-organa', name: 'Leia Organa', affiliations: ['rebellion', 'resistance'], biography: bio('Human', 'Female', 'Alderaan', '19BBY', 150, 49), movies: [3, 4, 5, 6, 7, 8, 9] },
  { id: 'han-solo', name: 'Han Solo', affiliations: ['rebellion', 'resistance'], biography: bio('Human', 'Male', 'Corellia', '29BBY', 180, 80), movies: [4, 5, 6, 7] },
  { id: 'chewbacca', name: 'Chewbacca', affiliations: ['rebellion', 'resistance'], biography: bio('Wookiee', 'Male', 'Kashyyyk', '200BBY', 228, 112), movies: [3, 4, 5, 6, 7, 8, 9] },
  { id: 'darth-vader', name: 'Darth Vader', affiliations: ['jedi', 'sith', 'republic', 'empire'], biography: bio('Human', 'Male', 'Tatooine', '41.9BBY', 202, 136), movies: [1, 2, 3, 4, 5, 6] },
  { id: 'yoda', name: 'Yoda', affiliations: ['jedi', 'republic'], biography: bio("Yoda's species", 'Male', null, '896BBY', 66, 17), movies: [1, 2, 3, 5, 6, 8] },
  { id: 'obi-wan-kenobi', name: 'Obi-Wan Kenobi', affiliations: ['jedi', 'republic', 'rebellion'], biography: bio('Human', 'Male', 'Stewjon', '57BBY', 182, 77), movies: [1, 2, 3, 4, 5, 6] },
  { id: 'r2-d2', name: 'R2-D2', affiliations: ['republic', 'rebellion', 'resistance'], biography: bio('Droid', null, 'Naboo', '33BBY', 96, 32), movies: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { id: 'c-3po', name: 'C-3PO', affiliations: ['republic', 'rebellion', 'resistance'], biography: bio('Droid', null, 'Tatooine', '112BBY', 167, 75), movies: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { id: 'palpatine', name: 'Palpatine', affiliations: ['sith', 'republic', 'empire'], biography: bio('Human', 'Male', 'Naboo', '82BBY', 170, 75), movies: [1, 2, 3, 5, 6, 9] },
  { id: 'padme-amidala', name: 'Padmé Amidala', affiliations: ['republic'], biography: bio('Human', 'Female', 'Naboo', '46BBY', 165, 45), movies: [1, 2, 3] },
  { id: 'rey', name: 'Rey', affiliations: ['jedi', 'resistance'], biography: bio('Human', 'Female', 'Jakku', '15ABY', 170, 54), movies: [7, 8, 9] },
  { id: 'kylo-ren', name: 'Kylo Ren', affiliations: ['first_order'], biography: bio('Human', 'Male', 'Chandrila', '5ABY', 189, 89), movies: [7, 8, 9] },
];

// Plans and their daily request limits (modelled on vpnapi.io's Free / Basic / Premium tiers).
// "trial" has a tiny limit so the 429 response is easy to see by hand.
const plans = {
  trial: { name: 'Trial', dailyLimit: 5 },
  free: { name: 'Free', dailyLimit: 1000 },
  basic: { name: 'Basic', dailyLimit: 10000 },
  premium: { name: 'Premium', dailyLimit: 50000 },
};

// Mock API keys. These are demo values for local testing only.
const apiKeys = {
  'demo-trial-key': 'trial',
  'demo-free-key': 'free',
  'demo-basic-key': 'basic',
  'demo-premium-key': 'premium',
};

module.exports = { movies, characters, AFFILIATIONS, plans, apiKeys };
