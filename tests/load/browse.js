// Load test (k6): ramp up to many concurrent visitors browsing the site.
//   k6 run -e API_URL=https://… -e SSR_URL=https://… tests/load/browse.js
import { check, sleep } from 'k6'
import http from 'k6/http'

const API_URL = __ENV.API_URL
const SSR_URL = __ENV.SSR_URL

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
}

const POKEMON = ['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'eevee', 'snorlax']

export default function () {
  check(http.get(`${API_URL}/health`), { 'health 200': r => r.status === 200 })
  check(http.get(`${API_URL}/wishlist`), { 'wishlist 200': r => r.status === 200 })
  if (SSR_URL) {
    const name = POKEMON[Math.floor(Math.random() * POKEMON.length)]
    check(http.get(`${SSR_URL}/pokemon/${name}`), { 'page 200': r => r.status === 200 })
  }
  sleep(1)
}
