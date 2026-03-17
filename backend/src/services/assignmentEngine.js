const dayjs = require("dayjs");

function uniqueLower(arr) {
  return Array.from(new Set((arr || []).map((s) => String(s || "").trim().toLowerCase()).filter(Boolean)));
}

function timeToMinutes(hhmm) {
  const [hh, mm] = String(hhmm).split(":").map((v) => Number(v));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

function availabilityMatchScore(volunteer, shiftStart, shiftEnd) {
  const slots = volunteer.availability || [];
  if (!slots.length) return 0;

  const start = dayjs(shiftStart);
  const end = dayjs(shiftEnd);
  const dow = start.day();

  const startMin = start.hour() * 60 + start.minute();
  const endMin = end.hour() * 60 + end.minute();

  for (const slot of slots) {
    if (slot.dayOfWeek !== dow) continue;
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    if (slotStart === null || slotEnd === null) continue;
    if (slotStart <= startMin && slotEnd >= endMin) return 1;
  }

  return 0;
}

function skillMatchScore(volunteer, requiredSkills) {
  const required = uniqueLower(requiredSkills);
  if (!required.length) return 1;
  const vSkills = uniqueLower(volunteer.skills);
  let matched = 0;
  for (const s of required) {
    if (vSkills.includes(s)) matched += 1;
  }
  return matched / required.length;
}

function lowHoursPriorityScore(volunteer, maxHours) {
  const h = Number(volunteer.totalHours || 0);
  if (!Number.isFinite(h)) return 0.5;
  if (!maxHours || maxHours <= 0) return 1;
  const normalized = Math.min(1, h / maxHours);
  return 1 - normalized;
}

function scoreVolunteer({ volunteer, requiredSkills, shiftStart, shiftEnd, maxHours }) {
  const sm = skillMatchScore(volunteer, requiredSkills);
  const am = availabilityMatchScore(volunteer, shiftStart, shiftEnd);
  const lh = lowHoursPriorityScore(volunteer, maxHours);

  const score = sm * 0.5 + am * 0.3 + lh * 0.2;

  return {
    score,
    components: {
      skillMatch: sm,
      availability: am,
      lowHoursPriority: lh
    }
  };
}

function suggestVolunteers({ volunteers, requiredSkills, shiftStart, shiftEnd, limit }) {
  const maxHours = Math.max(0, ...volunteers.map((v) => Number(v.totalHours || 0)).filter((n) => Number.isFinite(n)));

  const scored = volunteers
    .map((volunteer) => {
      const { score, components } = scoreVolunteer({ volunteer, requiredSkills, shiftStart, shiftEnd, maxHours });
      return { volunteer, score, components };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

module.exports = { suggestVolunteers };
