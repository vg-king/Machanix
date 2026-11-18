export const modelMap = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Dzire', 'Brezza', 'Wagon R', 'Alto K10'],
  Hyundai: ['i20', 'Creta', 'Venue', 'Grand i10 Nios', 'Verna', 'Aura'],
  Tata: ['Nexon', 'Punch', 'Tiago', 'Altroz', 'Harrier', 'Safari'],
  Mahindra: ['XUV 3XO', 'Scorpio N', 'Thar', 'XUV700', 'Bolero'],
  Honda: ['City', 'Amaze', 'Elevate', 'Jazz', 'WR-V'],
  Toyota: ['Innova Crysta', 'Fortuner', 'Glanza', 'Urban Cruiser Hyryder'],
  Kia: ['Seltos', 'Sonet', 'Carens', 'Carnival'],
  Volkswagen: ['Polo', 'Virtus', 'Taigun', 'Tiguan'],
  Renault: ['Kwid', 'Triber', 'Kiger', 'Duster'],
  Skoda: ['Slavia', 'Kushaq', 'Rapid', 'Superb'],
  BMW: ['3 Series', '5 Series', 'X1', 'X3'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'GLA'],
};

export const services = [
  { name: 'Basic Service', category: 'Scheduled Packages', minPrice: 2499, maxPrice: 3999, durationHours: 4, warranty: 'Service-specific terms apply' },
  { name: 'Standard Service', category: 'Scheduled Packages', minPrice: 3999, maxPrice: 5999, durationHours: 6, warranty: 'Service-specific terms apply' },
  { name: 'Comprehensive Service', category: 'Scheduled Packages', minPrice: 5999, maxPrice: 8999, durationHours: 8, warranty: 'Service-specific terms apply' },
  { name: 'AC Service & Repair', category: 'Repairs', minPrice: 1499, maxPrice: 4499, durationHours: 3, warranty: 'Depends on repair and parts' },
  { name: 'Battery Replacement', category: 'Repairs', minPrice: 3499, maxPrice: 8999, durationHours: 1, warranty: 'Depends on selected battery' },
  { name: 'Tyre & Wheel Care', category: 'Repairs', minPrice: 999, maxPrice: 5999, durationHours: 2, warranty: 'Depends on selected service' },
  { name: 'Denting & Painting', category: 'Body Work', minPrice: 2499, maxPrice: 14999, durationHours: 24, warranty: 'Depends on job scope' },
  { name: 'Car Spa & Cleaning', category: 'Detailing', minPrice: 799, maxPrice: 3999, durationHours: 3, warranty: 'Not applicable to all packages' },
  { name: 'Inspection & Diagnostics', category: 'Inspection', minPrice: 499, maxPrice: 1499, durationHours: 2, warranty: 'Inspection report only' },
  { name: 'Clutch & Body Parts', category: 'Repairs', minPrice: 2999, maxPrice: 19999, durationHours: 8, warranty: 'Depends on parts and repair' },
  { name: 'Windshields & Lights', category: 'Repairs', minPrice: 1499, maxPrice: 11999, durationHours: 4, warranty: 'Depends on parts and repair' },
];

export const cities = ['Bhubaneswar', 'Kolkata', 'Bengaluru', 'Delhi NCR', 'Hyderabad'];
export const knownFuels = new Set(['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']);

export function normalizeCar(car) {
  if (!car || typeof car !== 'object') return null;
  const make = String(car.make || '').trim();
  const model = String(car.model || '').trim();
  const fuel = String(car.fuel || '').trim();
  if (!modelMap[make] || !modelMap[make].includes(model) || !knownFuels.has(fuel)) return null;
  return { make, model, fuel };
}

export function estimateFor(car, serviceName) {
  if (!car || typeof car !== 'object') return null;
  const aliases = { 'Car Inspection / Diagnostics': 'Inspection & Diagnostics' };
  const normalizedName = aliases[serviceName] || serviceName;
  const service = services.find(item => item.name === normalizedName);
  if (!service) return null;
  let multiplier = new Set(['BMW', 'Mercedes-Benz']).has(car.make) ? 1.35 : 1;
  if (car.fuel === 'Diesel') multiplier *= 1.08;
  if (car.fuel === 'Electric' && service.category === 'Scheduled Packages') multiplier *= 1.12;
  const min = Math.round((service.minPrice * multiplier) / 50) * 50;
  const max = Math.round((service.maxPrice * multiplier) / 50) * 50;
  return {
    serviceName: service.name,
    currency: 'INR',
    estimatedMin: min,
    estimatedMax: max,
    durationHours: service.durationHours,
    warrantyNote: service.warranty,
    isDemoEstimate: true,
    disclaimer: 'Indicative estimate only. Final pricing depends on the vehicle and service inspection.',
  };
}
