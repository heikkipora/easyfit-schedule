import compression from 'compression'
import express from 'express'
import {fetchSchedule} from './scrape'
import fs from 'fs'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import ScheduleView from './schedule-view'

let SCHEDULE_CACHE = []
const INTERVAL_HOURLY = 60 * 60 * 1000
const RETRY_ONE_MINUTE = 60 * 1000

export async function initServer(port) {
  const app = express()
  app.disable('x-powered-by')
  app.use(compression())
  app.use(express.static('public'))
  if (process.env.NODE_ENV == 'production') {
    app.enable('trust proxy')
  }

  const indexTemplate = await fs.promises.readFile(path.resolve('src/views/index.html'), 'utf8')
  await updateScheduleHourly()

  app.get('/', (req, res) => {
    res.send(indexTemplate.replace('{{ react-rendered }}', ReactDOMServer.renderToStaticMarkup(<ScheduleView schedule={SCHEDULE_CACHE}/>))) 
  })

  return new Promise(resolve => app.listen(port, resolve))
}

async function updateScheduleHourly() {
  try {
    SCHEDULE_CACHE = await fetchSchedule()
    setTimeout(updateScheduleHourly, INTERVAL_HOURLY)
  } catch (err) {
    console.error(err)
    setTimeout(updateScheduleHourly, RETRY_ONE_MINUTE)
  }
}
