export const SKILLS = [
  "First Aid",
  "Medical Assistance",
  "Nursing Support",
  "Teaching",
  "Child Care",
  "Elderly Care",
  "Event Management",
  "Crowd Control",
  "Logistics",
  "Food Distribution",
  "Cooking",
  "Driving",
  "Ambulance Assistance",
  "Data Entry",
  "Photography",
  "Videography",
  "Social Media Management",
  "Fundraising",
  "Public Speaking",
  "Translation",
  "Counseling",
  "Mental Health Support",
  "Disaster Relief",
  "Rescue Operations",
  "Construction Help",
  "Cleaning & Sanitation",
  "Waste Management",
  "Environmental Work",
  "Tree Plantation",
  "Animal Care",
  "Shelter Support",
  "IT Support",
  "Web Development",
  "App Development",
  "Graphic Design",
  "Marketing",
  "Content Writing",
  "Survey Collection",
  "Research Assistance",
  "Coordination",
  "Volunteer Management",
  "Security Assistance",
  "Technical Setup",
  "Stage Management",
  "Registration Desk",
  "Help Desk Support",
  "Transport Coordination",
  "Packing & Distribution",
  "Field Work",
  "Community Outreach",
  "Water Distribution",
  "Teaching Assistant",
  "Kitchen Support",
  "Warehouse Support",
  "Emergency Response",
  "Sign Language",
  "Legal Aid",
  "CPR"
];

export const SKILL_OPTIONS = SKILLS.map((label) => ({
  value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  label
}));

export const SKILL_LABEL_BY_VALUE = Object.fromEntries(
  SKILL_OPTIONS.map((o) => [o.value, o.label])
);

export function labelForSkill(value) {
  return SKILL_LABEL_BY_VALUE[value] || value;
}