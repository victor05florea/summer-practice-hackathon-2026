export interface Profile {
  id: string
  username: string
  description: string
  sports: string[]
  skill_level: string
  available_today: boolean
  created_at: string
}

export interface Group {
  id: string
  sport: string
  captain_id: string
  members: string[]
  status: string
  created_at: string
}

export interface Message {
  id: string
  group_id: string
  user_id: string
  content: string
  created_at: string
}