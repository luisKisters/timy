export interface MockEvent {
  id: string;
  title: string;
  description: string;
  slots: MockSlot[];
}

export interface MockSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 2);

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export const mockEvent: MockEvent = {
  id: "demo-event-1",
  title: "Team Lunch",
  description: "Let's find a time for our team lunch this week!",
  slots: [
    { id: "slot-1", date: formatDate(tomorrow), startTime: "12:00", endTime: "13:00" },
    { id: "slot-2", date: formatDate(tomorrow), startTime: "13:00", endTime: "14:00" },
    { id: "slot-3", date: formatDate(dayAfter), startTime: "12:00", endTime: "13:00" },
    { id: "slot-4", date: formatDate(dayAfter), startTime: "18:00", endTime: "19:00" },
  ],
};
