import compression from 'compression'
import express from 'express'
import {fetchSchedule} from './scrape'
import fs from 'fs'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import ScheduleView from './schedule-view'

let CACHED_INDEX = '<html></html>'
const INTERVAL_HOURLY = 60 * 60 * 1000
const RETRY_ONE_MINUTE = 60 * 1000

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export async function initServer(port) {
  const app = express()
  app.disable('x-powered-by')
  app.use(forceHttps)
  app.use(compression())
  app.use(express.static('public'))
  if (IS_PRODUCTION) {
    app.enable('trust proxy')
  }

  await updateScheduleHourly()

  app.get('/', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.send(CACHED_INDEX)
  })

  return new Promise(resolve => app.listen(port, resolve))
}

async function updateScheduleHourly() {
  try {
    const schedule = await fetchSchedule()
    const template = await fs.promises.readFile(path.resolve('src/views/index.html'), 'utf8')
    CACHED_INDEX = template.replace('{{ react-rendered }}', ReactDOMServer.renderToStaticMarkup(<ScheduleView schedule={schedule}/>))
    setTimeout(updateScheduleHourly, INTERVAL_HOURLY)
  } catch (err) {
    console.error(err)
    setTimeout(updateScheduleHourly, RETRY_ONE_MINUTE)
  }
}

function forceHttps(req, res, next) {
  if (IS_PRODUCTION && !req.secure) {
    res.redirect(`https://${req.hostname}${req.originalUrl}`)
    return
  }
  next()
}