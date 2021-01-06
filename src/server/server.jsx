import compression from 'compression'
import express from 'express'
import {fetchSchedule} from './scrape'
import fs from 'fs'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import ScheduleView from './schedule-view'

let CACHED_SCHEDULE = []
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

  const template = await fs.promises.readFile(path.resolve('src/views/index.html'), 'utf8')

  updateScheduleHourly()

  app.get('/', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    const page = template.replace('{{ react-rendered }}', ReactDOMServer.renderToStaticMarkup(<ScheduleView schedule={CACHED_SCHEDULE}/>))
    res.send(page)
  })

  return new Promise(resolve => app.listen(port, resolve))
}

async function updateScheduleHourly() {
  try {
    CACHED_SCHEDULE = await fetchSchedule()
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