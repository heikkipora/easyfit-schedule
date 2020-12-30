import React from 'react'

export default function ScheduleView({schedule}) {
  return schedule.map(s => <p key={s.id}>${s.location.name}: ${s.training.name} @ ${s.time.day.toISOString()} ${s.time.from} - ${s.time.to} ${s.instructor.name}</p>)
}
