/**
 * Bundled, offline city list for the job-posting Location picker.
 *
 * No paid map/geocoding API (feedback_no_secrets_in_code) — this is a static,
 * curated list of major Kenyan towns plus key cities across Africa, loaded into
 * the searchable Combobox. Free-text entries are still allowed via the picker's
 * fallback, so this list only needs to cover the common cases.
 *
 * Each entry is "City, Country" so the same label is both the option value and the
 * stored location string (the backend `location` column is a free string).
 */

/** Major Kenyan counties / towns (HQ + branch locations). */
const KENYA = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Ruiru",
  "Kikuyu",
  "Naivasha",
  "Machakos",
  "Kitui",
  "Meru",
  "Nyeri",
  "Kericho",
  "Kakamega",
  "Bungoma",
  "Kisii",
  "Garissa",
  "Malindi",
  "Kilifi",
  "Diani",
  "Lamu",
  "Nanyuki",
  "Embu",
  "Kerugoya",
  "Murang'a",
  "Kiambu",
  "Athi River",
  "Kajiado",
  "Narok",
  "Voi",
  "Bomet",
  "Homa Bay",
  "Migori",
  "Busia",
  "Webuye",
  "Kitale",
  "Lodwar",
  "Isiolo",
  "Marsabit",
  "Wajir",
  "Mandera",
  "Kapenguria",
  "Maralal",
  "Nyahururu",
  "Ol Kalou",
  "Chuka",
  "Mwingi",
  "Wote",
  "Kwale",
].map((c) => `${c}, Kenya`);

/** Key hub cities across the rest of Africa (East/Central + major capitals). */
const AFRICA = [
  ["Kampala", "Uganda"],
  ["Entebbe", "Uganda"],
  ["Jinja", "Uganda"],
  ["Dar es Salaam", "Tanzania"],
  ["Dodoma", "Tanzania"],
  ["Arusha", "Tanzania"],
  ["Mwanza", "Tanzania"],
  ["Zanzibar City", "Tanzania"],
  ["Kigali", "Rwanda"],
  ["Bujumbura", "Burundi"],
  ["Addis Ababa", "Ethiopia"],
  ["Juba", "South Sudan"],
  ["Mogadishu", "Somalia"],
  ["Lagos", "Nigeria"],
  ["Abuja", "Nigeria"],
  ["Port Harcourt", "Nigeria"],
  ["Kano", "Nigeria"],
  ["Accra", "Ghana"],
  ["Kumasi", "Ghana"],
  ["Abidjan", "Côte d'Ivoire"],
  ["Dakar", "Senegal"],
  ["Bamako", "Mali"],
  ["Ouagadougou", "Burkina Faso"],
  ["Cairo", "Egypt"],
  ["Alexandria", "Egypt"],
  ["Casablanca", "Morocco"],
  ["Rabat", "Morocco"],
  ["Marrakesh", "Morocco"],
  ["Tunis", "Tunisia"],
  ["Algiers", "Algeria"],
  ["Tripoli", "Libya"],
  ["Khartoum", "Sudan"],
  ["Johannesburg", "South Africa"],
  ["Cape Town", "South Africa"],
  ["Durban", "South Africa"],
  ["Pretoria", "South Africa"],
  ["Lusaka", "Zambia"],
  ["Harare", "Zimbabwe"],
  ["Gaborone", "Botswana"],
  ["Windhoek", "Namibia"],
  ["Maputo", "Mozambique"],
  ["Lilongwe", "Malawi"],
  ["Luanda", "Angola"],
  ["Kinshasa", "DR Congo"],
  ["Lubumbashi", "DR Congo"],
  ["Brazzaville", "Congo"],
  ["Libreville", "Gabon"],
  ["Yaoundé", "Cameroon"],
  ["Douala", "Cameroon"],
  ["Nouakchott", "Mauritania"],
  ["Port Louis", "Mauritius"],
  ["Antananarivo", "Madagascar"],
].map(([c, country]) => `${c}, ${country}`);

/** All bundled cities as Combobox options ({value,label}). */
export const AFRICA_CITY_OPTIONS = [...KENYA, ...AFRICA].map((c) => ({
  value: c,
  label: c,
}));

/** Remote (work-from-anywhere) sentinel option, prepended for convenience. */
export const LOCATION_OPTIONS = [
  { value: "Remote", label: "Remote" },
  ...AFRICA_CITY_OPTIONS,
];
