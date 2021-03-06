import axios from 'axios'
import https from 'https'
import Promise from 'bluebird'
import {
  parseLocationDocument,
  parseLocationListDocument
} from './parse-html'

const client = axios.create({
  baseURL: 'https://varaus.easyfit.fi',
  httpsAgent: new https.Agent({keepAlive: true}),
  timeout: 60 * 1000
})

export async function fetchSchedule() {
  const locations = await fetchLocationList()
  const schedule = await Promise.map(locations, fetchLocationSchedule, {concurrency: 4})
  return filterSchedule(schedule.flat())
}

function filterSchedule(schedule) {
  return schedule
    .filter(s => !s.training.isVirtual &&
                 s.training.code !== 'PTT' &&
                 s.training.code !== 'EF_YKS' &&
                 s.training.name !== 'Kesäpistekisa' &&
                 s.training.name !== 'Kuntosali' &&
                 !s.training.name.includes('Sali varattu'))
}

async function fetchLocationList() {
  const {data} = await client('https://www.easyfit.fi/fi/dlsi/chooser?url=https%3A//varaus.easyfit.fi/ef_%2A%2ACALENDAR%2A%2A/index.php%3Ffunc%3Dla&plugin=CALENDAR')
  return parseLocationListDocument(data)
}

async function fetchLocationSchedule(location) {
  try {
    const sessionId = await fetchSessionId(location.id)
    const {data} = await client(urlPath(location.id), {headers: {Cookie: `php_time_offset=%2B2; all_rsvs_fetched=1; PHPSESSID=${sessionId}`}})
    return parseLocationDocument(data, location)
  } catch (err) {
    console.log(`Failed to fetch schedule for '${location.id}' because of: ${err.message}`)
    return []
  }
}

async function fetchSessionId(locationId) {
  const {headers} = await client(urlPath(locationId))
  return headers['set-cookie']
    .map(cookie => cookie.match(/PHPSESSID=([a-z0-9]+);/i))
    .filter(v => v)
    .map(matches => matches[1])
    .flat()
}

function urlPath(locationId) {
  return `${locationId}/index.php?func=la`
}