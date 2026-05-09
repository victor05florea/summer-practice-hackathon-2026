export interface Profile {
  id: string;
  username: string;
  description: string;
  age: number | null;
  city: string;
  gender: string;
  sports: string[];
  skill_level: string;
  available_today: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  sport: string;
  captain_id: string;
  members: string[];
  status: string;
  location: string | null;
  event_time: string | null;
  max_size: number;
  created_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  sport: string;
  group_id: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}
