export interface RegionOption {
  value: string;
  label: string;
}

export interface CityOption {
  value: string;
  label: string;
}

export const SAUDI_REGIONS: RegionOption[] = [
  { value: 'Riyadh', label: 'Riyadh (الرياض)' },
  { value: 'Makkah', label: 'Makkah (مكة المكرمة)' },
  { value: 'Eastern Province', label: 'Eastern Province (المنطقة الشرقية)' },
  { value: 'Madinah', label: 'Madinah (المدينة المنورة)' },
  { value: 'Al-Qassim', label: 'Al-Qassim (القصيم)' },
  { value: 'Tabuk', label: 'Tabuk (تبوك)' },
  { value: 'Asir', label: 'Asir (عسير)' },
  { value: 'Jazan', label: 'Jazan (جازان)' },
  { value: 'Hail', label: 'Hail (حائل)' },
  { value: 'Najran', label: 'Najran (نجران)' },
  { value: 'Al-Bahah', label: 'Al-Bahah (الباحة)' },
  { value: 'Al-Jawf', label: 'Al-Jawf (الجوف)' },
  { value: 'Northern Borders', label: 'Northern Borders (الحدود الشمالية)' },
];

export const SAUDI_CITIES_BY_REGION: Record<string, CityOption[]> = {
  Riyadh: [
    { value: 'Riyadh', label: 'Riyadh (الرياض)' },
    { value: 'Al-Kharj', label: 'Al-Kharj (الخرج)' },
    { value: 'Al Majma\'ah', label: 'Al Majma\'ah (المجمعة)' },
    { value: 'Ad Diriyah', label: 'Ad Diriyah (الدرعية)' },
    { value: 'Wadi ad-Dawasir', label: 'Wadi ad-Dawasir (وادي الدواسر)' },
    { value: 'Afif', label: 'Afif (عفيف)' },
    { value: 'Zulfi', label: 'Zulfi (الزلفي)' },
  ],
  Makkah: [
    { value: 'Jeddah', label: 'Jeddah (جدة)' },
    { value: 'Makkah', label: 'Makkah (مكة المكرمة)' },
    { value: 'Taif', label: 'Taif (الطائف)' },
    { value: 'Rabigh', label: 'Rabigh (رابغ)' },
    { value: 'Al Qunfudhah', label: 'Al Qunfudhah (القنفذة)' },
    { value: 'Khulais', label: 'Khulais (خليص)' },
  ],
  'Eastern Province': [
    { value: 'Dammam', label: 'Dammam (الدمام)' },
    { value: 'Khobar', label: 'Khobar (الخبر)' },
    { value: 'Jubail', label: 'Jubail (الجبيل)' },
    { value: 'Hofuf', label: 'Hofuf (الهفوف)' },
    { value: 'Qatif', label: 'Qatif (القطيف)' },
    { value: 'Khafji', label: 'Khafji (الخفجي)' },
    { value: 'Hafar Al-Batin', label: 'Hafar Al-Batin (حفر الباطن)' },
    { value: 'Abqaiq', label: 'Abqaiq (بقيق)' },
  ],
  Madinah: [
    { value: 'Madinah', label: 'Madinah (المدينة المنورة)' },
    { value: 'Yanbu', label: 'Yanbu (ينبع)' },
    { value: 'Al-Ula', label: 'Al-Ula (العلا)' },
    { value: 'Badr', label: 'Badr (بدر)' },
  ],
  'Al-Qassim': [
    { value: 'Buraidah', label: 'Buraidah (بريدة)' },
    { value: 'Unaizah', label: 'Unaizah (عنيزة)' },
    { value: 'Ar Rass', label: 'Ar Rass (الرس)' },
    { value: 'Al Mithnab', label: 'Al Mithnab (المذنب)' },
  ],
  Tabuk: [
    { value: 'Tabuk', label: 'Tabuk (تبوك)' },
    { value: 'Duba', label: 'Duba (ضبا)' },
    { value: 'Umluj', label: 'Umluj (أملج)' },
    { value: 'Tayma', label: 'Tayma (تيماء)' },
  ],
  Asir: [
    { value: 'Abha', label: 'Abha (أبها)' },
    { value: 'Khamis Mushait', label: 'Khamis Mushait (خميس مشيط)' },
    { value: 'Bisha', label: 'Bisha (بيشة)' },
    { value: 'Ahad Rafidah', label: 'Ahad Rafidah (أحد رفيدة)' },
  ],
  Jazan: [
    { value: 'Jazan', label: 'Jazan (جازان)' },
    { value: 'Sabya', label: 'Sabya (صبيا)' },
    { value: 'Abu Arish', label: 'Abu Arish (أبو عريش)' },
    { value: 'Samtah', label: 'Samtah (صامطة)' },
  ],
  Hail: [
    { value: 'Hail', label: 'Hail (حائل)' },
    { value: 'Baqa\'a', label: 'Baqa\'a (بقعاء)' },
  ],
  Najran: [
    { value: 'Najran', label: 'Najran (نجران)' },
    { value: 'Sharurah', label: 'Sharurah (شرورة)' },
  ],
  'Al-Bahah': [
    { value: 'Al-Bahah', label: 'Al-Bahah (الباحة)' },
    { value: 'Baljurashi', label: 'Baljurashi (بلجرشي)' },
    { value: 'Al Mandaq', label: 'Al Mandaq (المندق)' },
  ],
  'Al-Jawf': [
    { value: 'Sakakah', label: 'Sakakah (سكاكا)' },
    { value: 'Al Qurayyat', label: 'Al Qurayyat (القريات)' },
    { value: 'Dumat al-Jandal', label: 'Dumat al-Jandal (دومة الجندل)' },
  ],
  'Northern Borders': [
    { value: 'Arar', label: 'Arar (عرعر)' },
    { value: 'Rafha', label: 'Rafha (رفحاء)' },
    { value: 'Turaif', label: 'Turaif (طريف)' },
  ],
};
