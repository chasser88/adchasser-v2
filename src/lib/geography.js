// geography.js
// Global countries and regions for coverage selection
// Structure: { continent: { country: [regions] } }

export const GEOGRAPHY = {
  'Africa': {
    'Nigeria': [
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
      'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
      'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
      'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
      'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
    ],
    'Ghana': ['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Volta', 'Northern', 'Brong-Ahafo', 'Upper East', 'Upper West'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kikuyu', 'Coast', 'Rift Valley', 'Western', 'Nyanza'],
    'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'],
    'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El-Kheima', 'Port Said', 'Suez', 'Upper Egypt', 'Sinai', 'Delta Region'],
    'Ethiopia': ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'SNNPR', 'Somali', 'Afar', 'Harari'],
    'Tanzania': ['Dar es Salaam', 'Zanzibar', 'Mwanza', 'Arusha', 'Dodoma', 'Morogoro', 'Tanga', 'Mbeya'],
    'Uganda': ['Kampala', 'Central', 'Eastern', 'Northern', 'Western'],
    'Senegal': ['Dakar', 'Thiès', 'Saint-Louis', 'Diourbel', 'Kaolack', 'Fatick', 'Kolda', 'Tambacounda'],
    'Côte d\'Ivoire': ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man'],
    'Cameroon': ['Littoral', 'Centre', 'Far North', 'Northwest', 'Southwest', 'West', 'Adamawa', 'East', 'South', 'North'],
    'Zambia': ['Lusaka', 'Copperbelt', 'Eastern', 'Southern', 'Northern', 'Western', 'North-Western', 'Luapula', 'Muchinga', 'Central'],
    'Zimbabwe': ['Harare', 'Bulawayo', 'Manicaland', 'Mashonaland', 'Midlands', 'Matabeleland', 'Masvingo'],
    'Rwanda': ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'],
    'Morocco': ['Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Marrakesh-Safi', 'Fès-Meknès', 'Tanger-Tétouan-Al Hoceïma', 'Souss-Massa'],
  },

  'North America': {
    'United States': [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
      'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
      'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
      'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming', 'Washington D.C.'
    ],
    'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland & Labrador', 'Prince Edward Island', 'Northwest Territories', 'Nunavut', 'Yukon'],
    'Mexico': ['Mexico City', 'Jalisco', 'Nuevo León', 'Puebla', 'Guanajuato', 'Veracruz', 'Chihuahua', 'Baja California', 'Sonora', 'Coahuila', 'Oaxaca', 'Yucatán'],
  },

  'South America': {
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Maranhão', 'Amazonas', 'Goiás', 'Espírito Santo', 'Mato Grosso'],
    'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Antioquia', 'Valle del Cauca', 'Cundinamarca', 'Atlántico'],
    'Argentina': ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Entre Ríos', 'Salta', 'Misiones', 'Chaco', 'Corrientes'],
    'Chile': ['Santiago', 'Valparaíso', 'Biobío', 'La Araucanía', 'Los Lagos', 'O\'Higgins', 'Maule', 'Antofagasta'],
    'Peru': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco', 'Huancayo'],
    'Venezuela': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Ciudad Guayana', 'Maturín'],
  },

  'Europe': {
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland', 'London', 'South East', 'North West', 'Yorkshire', 'West Midlands', 'East of England', 'South West', 'East Midlands', 'North East'],
    'France': ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Hauts-de-France', 'Grand Est', 'Provence-Alpes-Côte d\'Azur', 'Pays de la Loire', 'Normandie', 'Bretagne'],
    'Germany': ['Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Lower Saxony', 'Hesse', 'Saxony', 'Berlin', 'Rhineland-Palatinate', 'Hamburg', 'Schleswig-Holstein', 'Brandenburg', 'Saxony-Anhalt'],
    'Spain': ['Madrid', 'Catalonia', 'Andalusia', 'Valencia', 'Galicia', 'Castile and León', 'Basque Country', 'Canary Islands', 'Castile-La Mancha', 'Murcia', 'Aragon', 'Balearic Islands'],
    'Italy': ['Lombardy', 'Lazio', 'Campania', 'Sicily', 'Veneto', 'Emilia-Romagna', 'Piedmont', 'Apulia', 'Tuscany', 'Calabria', 'Sardinia'],
    'Netherlands': ['North Holland', 'South Holland', 'Utrecht', 'North Brabant', 'Gelderland', 'Overijssel', 'Friesland', 'Groningen', 'Limburg', 'Drenthe', 'Zeeland', 'Flevoland'],
    'Sweden': ['Stockholm', 'Västra Götaland', 'Skåne', 'Uppsala', 'Östergötland', 'Jönköping', 'Halland', 'Dalarna', 'Gävleborg'],
    'Norway': ['Oslo', 'Viken', 'Innlandet', 'Vestfold og Telemark', 'Rogaland', 'Vestland', 'Møre og Romsdal', 'Trøndelag'],
    'Poland': ['Masovian', 'Silesian', 'Greater Poland', 'Lower Silesian', 'Łódź', 'Pomeranian', 'Kuyavian-Pomeranian', 'Lublin'],
    'Belgium': ['Brussels', 'Flanders', 'Wallonia'],
    'Switzerland': ['Zurich', 'Bern', 'Vaud', 'Aargau', 'Geneva', 'Lucerne', 'St. Gallen', 'Valais'],
    'Portugal': ['Lisbon', 'Porto', 'Braga', 'Setúbal', 'Aveiro', 'Coimbra', 'Leiria', 'Faro', 'Madeira', 'Azores'],
  },

  'Middle East': {
    'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    'Saudi Arabia': ['Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Qassim', 'Asir', 'Tabuk', 'Hail', 'Jizan', 'Najran'],
    'Qatar': ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Al Shamal'],
    'Kuwait': ['Kuwait City', 'Hawalli', 'Farwaniyah', 'Ahmadi', 'Jahra', 'Mubarak Al-Kabeer'],
    'Israel': ['Tel Aviv', 'Jerusalem', 'Haifa', 'Be\'er Sheva', 'Rishon LeZion', 'Northern', 'Southern', 'Central'],
    'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Kayseri'],
    'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Mafraq'],
    'Lebanon': ['Beirut', 'Mount Lebanon', 'North Lebanon', 'South Lebanon', 'Bekaa', 'Nabatieh'],
  },

  'Asia Pacific': {
    'China': ['Beijing', 'Shanghai', 'Guangdong', 'Sichuan', 'Zhejiang', 'Jiangsu', 'Shandong', 'Hubei', 'Hunan', 'Hebei', 'Fujian', 'Chongqing', 'Liaoning', 'Shaanxi', 'Yunnan'],
    'India': ['Maharashtra', 'Uttar Pradesh', 'Tamil Nadu', 'West Bengal', 'Karnataka', 'Gujarat', 'Rajasthan', 'Andhra Pradesh', 'Madhya Pradesh', 'Kerala', 'Telangana', 'Bihar', 'Punjab', 'Haryana', 'Delhi'],
    'Japan': ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Saitama', 'Chiba', 'Hyogo', 'Hokkaido', 'Fukuoka', 'Shizuoka', 'Kyoto', 'Hiroshima'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Gyeonggi', 'South Gyeongsang', 'North Gyeongsang'],
    'Indonesia': ['Java', 'Sumatra', 'Kalimantan', 'Sulawesi', 'Papua', 'Bali', 'Jakarta', 'West Java', 'East Java', 'Central Java'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory'],
    'Singapore': ['Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region'],
    'Malaysia': ['Selangor', 'Johor', 'Kuala Lumpur', 'Penang', 'Sabah', 'Sarawak', 'Perak', 'Pahang', 'Kedah', 'Kelantan'],
    'Philippines': ['Metro Manila', 'Cebu', 'Davao', 'Central Luzon', 'Calabarzon', 'Western Visayas', 'Northern Mindanao', 'Soccsksargen'],
    'Thailand': ['Bangkok', 'Central Thailand', 'Northern Thailand', 'Northeastern Thailand', 'Southern Thailand', 'Eastern Thailand'],
    'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong', 'Red River Delta', 'Mekong Delta', 'South Central Coast'],
    'Pakistan': ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad', 'Azad Kashmir', 'Gilgit-Baltistan'],
    'Bangladesh': ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'],
    'New Zealand': ['Auckland', 'Wellington', 'Canterbury', 'Waikato', 'Bay of Plenty', 'Manawatu-Whanganui', 'Hawke\'s Bay', 'Otago'],
  },
}

// Flat list of all countries
export const ALL_COUNTRIES = Object.values(GEOGRAPHY).flatMap(continent => Object.keys(continent)).sort()

// Get regions for a specific country
export function getRegions(country) {
  for (const continent of Object.values(GEOGRAPHY)) {
    if (continent[country]) return continent[country]
  }
  return []
}

// Get continent for a country
export function getContinent(country) {
  for (const [continent, countries] of Object.entries(GEOGRAPHY)) {
    if (countries[country]) return continent
  }
  return null
}

// Continents list
export const CONTINENTS = Object.keys(GEOGRAPHY)
