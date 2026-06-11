import { NextResponse } from 'next/server'
import { loadReminders } from '@/lib/calendar/load'

export async function GET() {
  try {
    const reminders = await loadReminders()
    return NextResponse.json(reminders)
  } catch (error) {
    console.error('GET /api/notifications failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
