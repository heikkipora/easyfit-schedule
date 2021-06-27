
import cheerio from 'cheerio'

export function parseLocationDocument(html, location) {
  const $ = cheerio.load(html)
  const parseTablFn = parseDayTableBody.bind(null, $, location)
  return $('#table_rsv_list tbody[id*="_"]').get().map(parseTablFn).flat()
}

function parseDayTableBody($, location, element) {
  const $tbody = $(element)
  const day = new Date(Number($tbody.attr('id').replace('day_', '')) * 1000)
  const parseRowFn = parseDayTableRow.bind(null, $, location, day)
  return $tbody.find('.tr-row:not(.extra_row)').get().map(parseRowFn)
}

function parseDayTableRow($, location, day, element) {
  const $tr = $(element)
  const id = $tr.attr('id')
  const trainingCode = $tr.attr('obj_code')
  const instructorCode = $tr.attr('ins_code')
  const trainingName = $tr.find('td.c_rsv_desc').text().trim()
  const instructorName = $tr.find('td.c_instructor').text().trim()
  const from = $tr.find('td.c_time_from').text().split('-')[0].trim()
  const to = $tr.find('td.c_time_to').text()
  const reservation = normalizeReservation($tr.find('td.c_rsv_counts').text().trim())
  const isVirtual = instructorName.toLowerCase().includes('virtuaali') ||
                    trainingName.toLowerCase().includes('virtuaali') ||
                    trainingName.toLowerCase().includes('virtual') ||
                    trainingName.toLowerCase().includes('omavalintainen')
  return {
    id,
    instructor: {
      name: instructorName,
      code: instructorCode
    },
    training: {
      name: trainingName,
      baseName: normalizeName(trainingName),
      code: trainingCode,
      isVirtual
    },
    time: {
      day,
      from,
      to
    },
    reservation,
    location
  }
}

// value can be '5/23(30)' or '3(15)'
function normalizeReservation(value) {
  if(value.includes('/')) {
    return value.split('(')[0]
  }
  return value.replace('(', '/').replace(')', '')
}

function normalizeName(trainingName) {
  return trainingName
    .replace('®', ' ')
    .replace(/\'?\d\d\'?/, '')
    .replace(/core.*/i, 'CORE')
    .replace(/.*pilates.*/i, 'Pilates')
    .replace(/crosstraining/i, 'Cross Training')
    .replace(/zumba.*/i, 'ZUMBA')
    .replace('  ', ' ')
    .replace('BODYBALANCE Flexibility', 'BODYBALANCE')
    .replace('Les Mills TONE', 'TONE')
    .replace('LES MILLS TONE', 'TONE')
    .replace(/Bodypump.*/, 'BODYPUMP')
    .replace(/Kahvakuula.*/, 'Kahvakuula')
    .replace('Reidet Vatsa Pakarat', 'RVP')
    .trim()
    .replace(/^Spinning.*/i, 'Spinning / Sisäpyöräily')
    .replace(/^Sisäpyöräily$/, 'Spinning / Sisäpyöräily')
    .replace(/^Body$/, 'BODY')
    .replace('Kehonhuolto/Venyttely', 'Kehonhuolto')
    .replace('Yin jooga', 'Yin Jooga')
    .replace('Pumppi', 'PUMPPI')
    .replace(/^Pump$/, 'PUMPPI')
    .replace(/^RVP.*/i, 'RVP')
    .replace('JOOGA', 'Jooga')
    .replace(/^HIIT.*/i, 'HIIT')
    .replace(/^GRIT.*/i, 'GRIT')
    .replace('CIRCUIT', 'Circuit')
    .replace('ULKOTREENIT', 'Ulkotreenit')
    .replace('Toiminnallinen', 'Ulkotreenit')
}

export function parseLocationListDocument(html) {
  const $ = cheerio.load(html)
  const parseLinkFn = parseLocationListLink.bind(null, $)
  return $('.dlsi-links-chooser-list li > a').get().map(parseLinkFn)
}

function parseLocationListLink($, element) {
  const $a = $(element)
  const [id] = $a.attr('href').replace('https://varaus.easyfit.fi/', '').split('/')
  const name = $a.text()
  return {id: fixBroken(id), name}
}

function fixBroken(id) {
  return id.replace(/^ef_ef_/, 'ef_')
}
