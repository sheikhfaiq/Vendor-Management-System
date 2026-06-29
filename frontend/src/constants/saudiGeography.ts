export interface RegionOption {
  value: string;
  label: string;
}

export interface CityOption {
  value: string;
  label: string;
}

export interface CountryOption {
  value: string;
  label: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { value: 'Saudi Arabia', label: 'Saudi Arabia (KSA)' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'Bahrain', label: 'Bahrain' },
  { value: 'Kuwait', label: 'Kuwait' },
  { value: 'Oman', label: 'Oman' },
  { value: 'Qatar', label: 'Qatar' },
];

export const SAUDI_REGIONS: RegionOption[] = [
  { value: 'Riyadh Region', label: 'Riyadh Region' },
  { value: 'Makkah Region', label: 'Makkah Region' },
  { value: 'Madinah Region', label: 'Madinah Region' },
  { value: 'Eastern Province', label: 'Eastern Province (Ash Sharqiyah)' },
  { value: 'Asir Region', label: 'Asir Region' },
  { value: 'Jazan Region', label: 'Jazan Region' },
  { value: 'Najran Region', label: 'Najran Region' },
  { value: 'Al Qassim Region', label: 'Al Qassim Region' },
  { value: 'Hail Region', label: 'Hail Region' },
  { value: 'Tabuk Region', label: 'Tabuk Region' },
  { value: 'Northern Borders Region', label: 'Northern Borders Region' },
  { value: 'Al Jawf Region', label: 'Al Jawf Region' },
  { value: 'Al Bahah Region', label: 'Al Bahah Region' },
];

export const SAUDI_CITIES_BY_REGION: Record<string, CityOption[]> = {
  'Riyadh Region': [
    { value: 'Riyadh', label: 'Riyadh' },
    { value: 'Al Kharj', label: 'Al Kharj' },
    { value: 'Al Majma\'ah', label: 'Al Majma\'ah' },
    { value: 'Wadi Al-Dawasir', label: 'Wadi Al-Dawasir' },
    { value: 'Al Zulfi', label: 'Al Zulfi' },
  ],
  'Makkah Region': [
    { value: 'Jeddah', label: 'Jeddah' },
    { value: 'Makkah', label: 'Makkah' },
    { value: 'Taif', label: 'Taif' },
    { value: 'Rabigh', label: 'Rabigh' },
    { value: 'Al Lith', label: 'Al Lith' },
  ],
  'Madinah Region': [
    { value: 'Madinah', label: 'Madinah' },
    { value: 'Yanbu', label: 'Yanbu' },
    { value: 'Al Ula', label: 'Al Ula' },
    { value: 'Badr', label: 'Badr' },
    { value: 'Khaybar', label: 'Khaybar' },
  ],
  'Eastern Province': [
    { value: 'Dammam', label: 'Dammam' },
    { value: 'Khobar', label: 'Khobar' },
    { value: 'Dhahran', label: 'Dhahran' },
    { value: 'Jubail', label: 'Jubail' },
    { value: 'Al Ahsa', label: 'Al Ahsa' },
    { value: 'Qatif', label: 'Qatif' },
    { value: 'Hafr Al Batin', label: 'Hafr Al Batin' },
  ],
  'Asir Region': [
    { value: 'Abha', label: 'Abha' },
    { value: 'Khamis Mushait', label: 'Khamis Mushait' },
    { value: 'Ahad Rafidah', label: 'Ahad Rafidah' },
    { value: 'Mahayil Asir', label: 'Mahayil Asir' },
    { value: 'Sarat Abidah', label: 'Sarat Abidah' },
  ],
  'Jazan Region': [
    { value: 'Jazan', label: 'Jazan' },
    { value: 'Sabya', label: 'Sabya' },
    { value: 'Abu Arish', label: 'Abu Arish' },
    { value: 'Samtah', label: 'Samtah' },
    { value: 'Farasan', label: 'Farasan' },
  ],
  'Najran Region': [
    { value: 'Najran', label: 'Najran' },
    { value: 'Sharurah', label: 'Sharurah' },
    { value: 'Hubuna', label: 'Hubuna' },
    { value: 'Badr Al Janub', label: 'Badr Al Janub' },
  ],
  'Al Qassim Region': [
    { value: 'Buraydah', label: 'Buraydah' },
    { value: 'Unaizah', label: 'Unaizah' },
    { value: 'Ar Rass', label: 'Ar Rass' },
    { value: 'Al Bukayriyah', label: 'Al Bukayriyah' },
    { value: 'Al Badayea', label: 'Al Badayea' },
  ],
  'Hail Region': [
    { value: 'Hail', label: 'Hail' },
    { value: 'Baqaa', label: 'Baqaa' },
    { value: 'Ghazalah', label: 'Ghazalah' },
    { value: 'Ash Shamli', label: 'Ash Shamli' },
  ],
  'Tabuk Region': [
    { value: 'Tabuk', label: 'Tabuk' },
    { value: 'Duba', label: 'Duba' },
    { value: 'Al Wajh', label: 'Al Wajh' },
    { value: 'Umluj', label: 'Umluj' },
    { value: 'Haql', label: 'Haql' },
    { value: 'Tayma', label: 'Tayma' },
  ],
  'Northern Borders Region': [
    { value: 'Arar', label: 'Arar' },
    { value: 'Rafha', label: 'Rafha' },
    { value: 'Turaif', label: 'Turaif' },
    { value: 'Al Uwayqilah', label: 'Al Uwayqilah' },
  ],
  'Al Jawf Region': [
    { value: 'Sakaka', label: 'Sakaka' },
    { value: 'Qurayyat', label: 'Qurayyat' },
    { value: 'Dumat Al Jandal', label: 'Dumat Al Jandal' },
    { value: 'Tabarjal', label: 'Tabarjal' },
  ],
  'Al Bahah Region': [
    { value: 'Al Bahah', label: 'Al Bahah' },
    { value: 'Baljurashi', label: 'Baljurashi' },
    { value: 'Al Mandaq', label: 'Al Mandaq' },
    { value: 'Al Aqiq', label: 'Al Aqiq' },
    { value: 'Qilwah', label: 'Qilwah' },
  ],
};
