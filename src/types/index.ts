export interface Event {
  id: string;
  title: string;
  description: string;
  creator_name: string;
  expiry: string | null;
  resolved_slot: string | null;
  created: string;
  updated: string;
}

export interface TimeSlot {
  id: string;
  event_id: string;
  start: string;
  end: string;
  created: string;
  updated: string;
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  created: string;
  updated: string;
}

export interface Vote {
  id: string;
  participant_id: string;
  slot_id: string;
  available: boolean;
  created: string;
  updated: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  expiry: string;
  slots: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
}
