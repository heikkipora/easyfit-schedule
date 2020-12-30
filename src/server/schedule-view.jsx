import {fi} from 'date-fns/locale'
import {format} from 'date-fns'
import React from 'react'

export default function ScheduleView({schedule}) {
  const grouped = groupByTraining(schedule)
  const trainingNames = Object.keys(grouped).sort(caseInsensitiveSort)
  return trainingNames.map(renderTraining.bind(null, grouped))
}

function renderTraining(grouped, trainingName) {
  return <div key={trainingName} className="training">
    <h2>{trainingName}</h2>
    <ol>
      {grouped[trainingName].map(s => <li key={s.id}>
        <span>{format(s.time.day, 'EEEEEE dd.MM.', {locale: fi})}</span>
        <span>{s.time.from} - {s.time.to}</span>
        <span>{s.training.name}</span>
        <span>{s.location.name}{s.instructor.name ? ` (${s.instructor.name})` : ''}</span>
      </li>)}
    </ol>
  </div>
}

function groupByTraining(entries) {
  return entries.reduce((acc, entry) => {
    (acc[entry.training.baseName] = acc[entry.training.baseName] || []).push(entry)
    return acc
  }, {})
}

function caseInsensitiveSort(a, b) {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()
  if (aLower > bLower) {
    return 1
  } else if (aLower < bLower) {
    return -1
  }
  return 0
}
