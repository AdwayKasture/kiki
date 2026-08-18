import type { Session } from '../types'

const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`HTTP ${response.status}: ${body}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function fetchSessions(): Promise<Session[]> {
  const { data } = await request<{ data: Session[] }>('/sessions')
  return data
}

export async function createSession(source: string): Promise<Session> {
  const { data } = await request<{ data: Session }>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ source }),
  })
  return data
}

export async function deleteSession(id: string): Promise<void> {
  await request<void>(`/sessions/${id}`, { method: 'DELETE' })
}
