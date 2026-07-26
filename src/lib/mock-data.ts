// Demo data used to make the marketplace views feel populated
// before real users and providers exist in the database.
export type MockProvider = {
  id: string;
  name: string;
  headline: string;
  tier: "Gold" | "Silver" | "Bronze";
  hourlyRate: number;
  monthlyPlan: number;
  distanceMiles: number;
  rating: number;
  specialties: string[];
  whyMatch: string[];
  verifications: { label: string; date: string }[];
  initials: string;
};

export const mockProviders: MockProvider[] = [
  {
    id: "elena-m",
    name: "Elena M.",
    headline: "Dementia Care Specialist",
    tier: "Gold",
    hourlyRate: 24,
    monthlyPlan: 480,
    distanceMiles: 1.2,
    rating: 4.9,
    specialties: ["Companionship", "Meal prep", "Mobility support"],
    whyMatch: [
      "Close to Martha (1.2 mi)",
      "Mobility-trained",
      "Non-smoker",
      "Speaks English & Spanish",
    ],
    verifications: [
      { label: "ID Verified", date: "Oct 2023" },
      { label: "Background Check", date: "Sept 2024" },
      { label: "License Check", date: "Active" },
      { label: "References", date: "3 of 3" },
    ],
    initials: "EM",
  },
  {
    id: "james-w",
    name: "James W.",
    headline: "Companion & Errand Helper",
    tier: "Silver",
    hourlyRate: 19,
    monthlyPlan: 304,
    distanceMiles: 3.4,
    rating: 4.8,
    specialties: ["Errands", "Rides", "Yard help"],
    whyMatch: ["Available Tues & Thurs mornings", "Enjoys gardening", "Non-smoker"],
    verifications: [
      { label: "ID Verified", date: "Aug 2024" },
      { label: "Background Check", date: "Aug 2024" },
      { label: "References", date: "2 of 2" },
    ],
    initials: "JW",
  },
  {
    id: "priya-s",
    name: "Priya S.",
    headline: "Personal Care Aide, CNA",
    tier: "Gold",
    hourlyRate: 28,
    monthlyPlan: 560,
    distanceMiles: 2.1,
    rating: 5.0,
    specialties: ["Personal care", "Medication reminders", "Fall prevention"],
    whyMatch: ["CNA certified", "Fall-prevention trained", "Available weekends"],
    verifications: [
      { label: "ID Verified", date: "May 2024" },
      { label: "Background Check", date: "May 2024" },
      { label: "CNA License", date: "Verified" },
      { label: "Insurance", date: "Active" },
    ],
    initials: "PS",
  },
];

export const mockRegulars = [
  { name: "James", initials: "JW", lastVisit: "2 days ago" },
  { name: "Elena", initials: "EM", lastVisit: "Last week" },
];

export type MockPerson = {
  providerId: string;
  name: string;
  initials: string;
  serviceType: string;
  visitCount: number;
  lastVisit: string;
};

export const mockPeople: MockPerson[] = [
  {
    providerId: "elena-m",
    name: "Elena M.",
    initials: "EM",
    serviceType: "Companionship & meal prep",
    visitCount: 24,
    lastVisit: "Yesterday",
  },
  {
    providerId: "james-w",
    name: "James W.",
    initials: "JW",
    serviceType: "Errands & rides",
    visitCount: 11,
    lastVisit: "2 days ago",
  },
  {
    providerId: "priya-s",
    name: "Priya S.",
    initials: "PS",
    serviceType: "Personal care",
    visitCount: 4,
    lastVisit: "Last Saturday",
  },
];

export type MockMessage = {
  from: "me" | "them";
  text: string;
  time: string;
};

export type MockConversation = {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
  messages: MockMessage[];
};

export const mockConversations: MockConversation[] = [
  {
    id: "elena-m",
    name: "Elena M.",
    initials: "EM",
    lastMessage: "See you at 2:30 — I'll bring the soup recipe.",
    lastTime: "12:14 PM",
    unread: true,
    messages: [
      { from: "them", text: "Good morning! Still on for 2:30 today?", time: "9:02 AM" },
      { from: "me", text: "Yes please. Front door will be unlocked.", time: "9:14 AM" },
      { from: "them", text: "See you at 2:30 — I'll bring the soup recipe.", time: "12:14 PM" },
    ],
  },
  {
    id: "james-w",
    name: "James W.",
    initials: "JW",
    lastMessage: "Picked up the prescriptions — leaving CVS now.",
    lastTime: "Yesterday",
    unread: false,
    messages: [
      { from: "them", text: "On my way to the pharmacy.", time: "3:40 PM" },
      { from: "them", text: "Picked up the prescriptions — leaving CVS now.", time: "4:02 PM" },
      { from: "me", text: "Thank you James.", time: "4:05 PM" },
    ],
  },
  {
    id: "concierge",
    name: "CareMatch Concierge",
    initials: "CM",
    lastMessage: "Your Saturday visit is confirmed with Priya.",
    lastTime: "Mon",
    unread: false,
    messages: [
      { from: "them", text: "Your Saturday visit is confirmed with Priya.", time: "Mon 10:11 AM" },
    ],
  },
];

export const mockRecentActivity = [
  {
    kind: "visit" as const,
    title: "Visit completed",
    detail: "Elena M. • 2h 30m",
    date: "Yesterday",
    amount: 55,
  },
  {
    kind: "verify" as const,
    title: "Verification renewed",
    detail: "James W. • Annual Background Check",
    date: "Oct 4",
  },
  {
    kind: "visit" as const,
    title: "Visit completed",
    detail: "James W. • 2h",
    date: "Oct 12",
    amount: 38,
  },
  {
    kind: "visit" as const,
    title: "Visit completed",
    detail: "Elena M. • 3h",
    date: "Oct 8",
    amount: 72,
  },
];
