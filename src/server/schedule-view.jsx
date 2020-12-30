import React from 'react'
import {format} from 'date-fns'
import {fi} from 'date-fns/locale'

export default function ScheduleView({schedule}) {
  const filteredEntries = schedule
    .filter(s => !s.training.isVirtual &&
                  s.training.code !== 'PTT' &&
                  s.training.code !== 'EF_YKS' &&
                  !s.training.name.includes('Sali varattu'))

  const grouped = groupByTraining(filteredEntries)
  const trainingNames = Object.keys(grouped).sort()
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
