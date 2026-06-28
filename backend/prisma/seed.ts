import { PrismaClient, Role, VendorType, ScopeOfWork, VendorStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to calculate profile completion score for seeding
const getProfileCompletion = (profile: {
  vendorType: VendorType;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  region?: string | null;
  country: string;
  companyName?: string | null;
  tradeLicenseNo?: string | null;
  taxRegistrationNo?: string | null;
  hasServices: boolean;
}): number => {
  let score = 0;

  if (profile.ownerName.trim().length >= 2) score += 10;
  if (profile.phone.trim().length >= 8) score += 10;
  if (profile.address.trim().length >= 5) score += 10;
  if (profile.region && profile.region.trim().length >= 2) score += 10;
  if (profile.city.trim().length >= 2) score += 10;
  if (profile.country.trim().length >= 2) score += 10;

  if (profile.vendorType === VendorType.COMPANY) {
    if (profile.companyName && profile.companyName.trim().length > 0) score += 10;
    if (profile.tradeLicenseNo && profile.tradeLicenseNo.trim().length > 0) score += 10;
    if (profile.taxRegistrationNo && profile.taxRegistrationNo.trim().length > 0) score += 10;
  } else {
    score = score * 1.333;
  }

  score = Math.round(score);

  if (profile.hasServices) {
    score += 20;
  }

  return Math.min(100, score);
};

async function main() {
  console.log('🔄 Cleaning up existing database records...');
  await prisma.activityLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.vendorService.deleteMany({});
  await prisma.vendorProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.subCategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.mainCategory.deleteMany({});

  console.log('🔑 Seeding Administrator account...');
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  await prisma.user.create({
    data: {
      email: 'admin@vms.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('  Admin created: admin@vms.com / Admin@123456');

  console.log('📂 Seeding hierarchical service categories...');
  const servicesHierarchy = [
    {
      mainCategory: 'Civil Works',
      categories: [
        {
          name: 'Site Preparation',
          subCategories: [
            'Surveying',
            'Site Clearance',
            'Demolition',
            'Excavation',
            'Dewatering',
            'Earthworks',
            'Backfilling',
            'Soil Improvement',
          ],
        },
        {
          name: 'Foundations',
          subCategories: [
            'Piling Works',
            'Bored Piles',
            'Driven Piles',
            'Pile Caps',
            'Raft Foundations',
            'Isolated Footings',
            'Combined Footings',
            'Ground Beams',
          ],
        },
        {
          name: 'Substructure',
          subCategories: [
            'Basement Structures',
            'Retaining Walls',
            'Waterproofing',
            'Underground Pits',
            'Underground Tanks',
          ],
        },
        {
          name: 'Superstructure (Concrete)',
          subCategories: [
            'Columns',
            'Shear Walls',
            'Core Walls',
            'Beams',
            'Slabs',
            'Transfer Structures',
            'Staircases',
            'Ramps',
          ],
        },
        {
          name: 'Architectural Civil Works',
          subCategories: [
            'Blockwork',
            'Masonry',
            'Plastering',
            'Screeding',
            'Raised Floors',
            'Waterproofing',
            'Roofing Systems',
          ],
        },
      ],
    },
    {
      mainCategory: 'Structural Steel Works',
      categories: [
        {
          name: 'Steel Fabrication',
          subCategories: [
            'Shop Drawings',
            'Material Procurement',
            'Fabrication',
            'Surface Treatment',
            'Painting',
            'Fireproofing Preparation',
          ],
        },
        {
          name: 'Steel Erection',
          subCategories: [
            'Steel Columns',
            'Steel Beams',
            'Trusses',
            'Bracings',
            'Platforms',
            'Catwalks',
            'Roof Structures',
          ],
        },
        {
          name: 'Connection Works',
          subCategories: ['Bolted Connections', 'Welded Connections', 'Base Plates', 'Anchor Bolts'],
        },
        {
          name: 'Specialized Steel Structures',
          subCategories: [
            'Space Frames',
            'Canopies',
            'Airport Roof Structures',
            'Metro Station Steel Structures',
            'Pipe Racks',
            'Equipment Support Structures',
          ],
        },
      ],
    },
    {
      mainCategory: 'MEP',
      categories: [
        {
          name: 'Mechanical Systems',
          subCategories: [
            'HVAC',
            'Central Chiller Plant',
            'Cooling Towers',
            'Chilled Water Network',
            'Condenser Water Network',
            'AHUs',
            'FCUs',
            'VRF / VRV Systems',
            'Precision Air Conditioning (Data Centers)',
            'Ventilation Systems',
            'Kitchen Ventilation',
            'Car Park Ventilation',
            'Smoke Management Systems',
            'Pressurization Systems',
            'Fire Fighting',
            'Fire Water Tanks',
            'Fire Pumps',
            'Sprinkler Systems',
            'Hydrant Systems',
            'Hose Reel Systems',
            'Foam Systems',
            'Clean Agent Systems (FM200 / Novec)',
            'Water Mist Systems',
            'Fuel & Gas',
            'Diesel Fuel Systems',
            'LPG Systems',
            'Natural Gas Systems',
            'Specialized Mechanical Systems',
            'Medical Gas Systems (Hospitals)',
            'Pneumatic Tube Systems (Hospitals)',
            'Baggage Handling Systems (Airports)',
            'Platform Screen Door HVAC Integration (Metro)',
            'Data Center Cooling Systems',
          ],
        },
        {
          name: 'Electrical Systems',
          subCategories: [
            'HV Systems',
            'Utility Interface',
            'GIS / AIS Substations',
            'HV Switchgear',
            'HV Cabling',
            'MV Systems',
            'Transformers',
            'Ring Main Units (RMU)',
            'MV Switchgear',
            'LV Systems',
            'MDBs',
            'SMDBs',
            'Final Distribution Boards',
            'Power Cabling',
            'Emergency Power',
            'Diesel Generators',
            'UPS Systems',
            'Battery Systems',
            'Static Transfer Switches',
            'Lighting',
            'Internal Lighting',
            'External Lighting',
            'Emergency Lighting',
            'Architectural Lighting',
            'Airfield Lighting (Airports)',
            'Earthing & Lightning Protection',
            'Grounding Network',
            'Lightning Protection Systems',
            'Renewable Energy',
            'Solar PV Systems',
            'Energy Storage Systems',
          ],
        },
        {
          name: 'ELV / ICT Systems',
          subCategories: [
            'Structured Cabling',
            'Copper Network',
            'Fiber Optic Backbone',
            'Data Center Cabling',
            'Security Systems',
            'CCTV',
            'Access Control',
            'Intrusion Detection',
            'Perimeter Security',
            'Communication Systems',
            'Intercom',
            'Public Address',
            'IPTV',
            'SMATV',
            'IT Infrastructure',
            'Server Rooms',
            'Data Centers',
            'Network Equipment Rooms',
            'Building Automation',
            'Building Management System (BMS)',
            'Energy Management System (EMS)',
            'Life Safety Systems',
            'Fire Alarm System',
            'Voice Evacuation System',
            'Emergency Communication System',
            'Specialized ELV',
            'Passenger Information System (Metro)',
            'Flight Information Display System (Airports)',
            'Nurse Call System (Hospitals)',
            'Queue Management Systems',
          ],
        },
        {
          name: 'Plumbing Systems',
          subCategories: [
            'Water Supply',
            'Domestic Cold Water',
            'Domestic Hot Water',
            'Booster Pump Systems',
            'Water Storage Tanks',
            'Drainage',
            'Soil & Waste Systems',
            'Vent Systems',
            'Storm Water Systems',
            'Rainwater Systems',
            'Sanitary Systems',
            'Fixtures',
            'Water Heating Systems',
            'Grease Waste Systems',
            'Irrigation',
            'Landscape Irrigation',
            'Treated Water Irrigation',
            'Water Treatment',
            'RO Plants',
            'Water Softening',
            'Filtration Systems',
            'Wastewater Treatment',
            'Sewage Treatment Plants (STP)',
            'Grey Water Treatment Systems',
          ],
        },
      ],
    },
    {
      mainCategory: 'Building Envelope',
      categories: [
        {
          name: 'Facade Systems',
          subCategories: ['Curtain Walls', 'Unitized Facade', 'Stick Facade', 'Glazing Systems'],
        },
        {
          name: 'Cladding Systems',
          subCategories: ['Aluminum Cladding', 'Stone Cladding', 'GRC Cladding', 'Metal Panels'],
        },
        {
          name: 'Roofing Systems',
          subCategories: ['Metal Roofing', 'Waterproof Membranes', 'Insulation Systems'],
        },
      ],
    },
    {
      mainCategory: 'Infrastructure Works',
      categories: [
        {
          name: 'Roads & Pavements',
          subCategories: ['Road Construction', 'Asphalt Paving', 'Concrete Paving', 'Kerbs', 'Interlock Paving'],
        },
        {
          name: 'Utilities',
          subCategories: ['Potable Water Networks', 'Irrigation Networks', 'Sewer Networks', 'Stormwater Networks', 'Utility Corridors'],
        },
        {
          name: 'External Works',
          subCategories: ['Landscaping', 'Hardscape', 'Fencing', 'Gates', 'Site Furniture'],
        },
        {
          name: 'Underground Structures',
          subCategories: ['Utility Tunnels', 'Culverts', 'Service Ducts', 'Chambers', 'Manholes'],
        },
      ],
    },
    {
      mainCategory: 'Temporary Works',
      categories: [
        {
          name: 'Excavation Support',
          subCategories: ['Shoring', 'Sheet Piling', 'Soldier Piles', 'Diaphragm Walls'],
        },
        {
          name: 'Construction Support',
          subCategories: ['Formwork', 'Scaffolding', 'Falsework', 'Temporary Platforms'],
        },
      ],
    },
    {
      mainCategory: 'Finishing Works (Civil Scope)',
      categories: [
        {
          name: 'Internal Finishes',
          subCategories: ['Floor Finishes', 'Wall Finishes', 'Ceiling Systems', 'Painting'],
        },
        {
          name: 'External Finishes',
          subCategories: ['External Paving', 'External Architectural Features'],
        },
      ],
    },
    {
      mainCategory: 'Specialized Systems by Project Type',
      categories: [
        {
          name: 'Hospitals',
          subCategories: [
            'Medical Gas Systems',
            'Nurse Call Systems',
            'Isolation Room Pressure Control',
            'Pneumatic Tube Systems',
            'Specialized HVAC for Operating Theaters',
          ],
        },
        {
          name: 'Airports',
          subCategories: [
            'Baggage Handling Systems',
            'Airfield Lighting',
            'Flight Information Systems',
            'Fuel Hydrant Systems',
            'Large-Scale Smoke Control Systems',
          ],
        },
        {
          name: 'Metro Stations',
          subCategories: [
            'Tunnel Ventilation Systems',
            'Traction Power Interfaces',
            'Platform Screen Door Systems',
            'Passenger Information Systems',
            'Emergency Ventilation Systems',
          ],
        },
        {
          name: 'Data Centers',
          subCategories: [
            'Precision Cooling (CRAC/CRAH)',
            'UPS Systems',
            'Busway Systems',
            'Clean Agent Fire Suppression',
            'DCIM (Data Center Infrastructure Management)',
          ],
        },
      ],
    },
  ];

  // Helper map to quickly lookup Subcategory ID by name
  const subCategoryMap: { [key: string]: string } = {};

  for (const mcData of servicesHierarchy) {
    const mainCategory = await prisma.mainCategory.create({
      data: { name: mcData.mainCategory },
    });

    for (const catData of mcData.categories) {
      const category = await prisma.category.create({
        data: {
          name: catData.name,
          mainCategoryId: mainCategory.id,
        },
      });

      for (const subName of catData.subCategories) {
        const subCat = await prisma.subCategory.create({
          data: {
            name: subName,
            categoryId: category.id,
          },
        });
        subCategoryMap[subName] = subCat.id;
      }
    }
  }
  console.log(`  Seeded ${Object.keys(subCategoryMap).length} subcategories.`);

  console.log('🏢 Seeding Vendors and service mappings...');
  const hashedVendorPassword = await bcrypt.hash('Vendor@123456', 10);

  // Define 10 distinct vendors
  const vendorsData = [
    {
      email: 'civilcon@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'CivilCon Builders Ltd',
      tradeLicenseNo: 'TL-CIV-001',
      taxRegistrationNo: 'TX-CIV-999',
      ownerName: 'Arthur Pendelton',
      phone: '+971501112222',
      address: 'Industrial Area 4, Block C',
      city: 'Abu Dhabi',
      country: 'UAE',
      status: VendorStatus.APPROVED,
      businessCategory: 'Contractor',
      services: [
        { name: 'Bored Piles', scopes: [ScopeOfWork.DESIGN_ENGINEERING, ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Driven Piles', scopes: [ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'Columns', scopes: [ScopeOfWork.INSTALLATION] },
        { name: 'Beams', scopes: [ScopeOfWork.INSTALLATION] },
        { name: 'Slabs', scopes: [ScopeOfWork.INSTALLATION] },
      ],
    },
    {
      email: 'steelforce@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'SteelForce Structures Corp',
      tradeLicenseNo: 'TL-STL-002',
      taxRegistrationNo: 'TX-STL-888',
      ownerName: 'Marc Sterling',
      phone: '+971502223333',
      address: 'Steel Yard Road, Plot 12',
      city: 'Sharjah',
      country: 'UAE',
      status: VendorStatus.APPROVED,
      businessCategory: 'Contractor',
      services: [
        { name: 'Shop Drawings', scopes: [ScopeOfWork.DESIGN_ENGINEERING] },
        { name: 'Fabrication', scopes: [ScopeOfWork.SUPPLY] },
        { name: 'Steel Columns', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Steel Beams', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Trusses', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
      ],
    },
    {
      email: 'electromech@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'ElectroMech HVAC Engineering',
      tradeLicenseNo: 'TL-ELM-003',
      taxRegistrationNo: 'TX-ELM-777',
      ownerName: 'Nikola Vane',
      phone: '+971503334444',
      address: 'Al Quoz Industrial 3',
      city: 'Dubai',
      country: 'UAE',
      status: VendorStatus.PENDING,
      businessCategory: 'Sub-Contractor',
      services: [
        { name: 'HVAC', scopes: [ScopeOfWork.DESIGN_ENGINEERING, ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'Central Chiller Plant', scopes: [ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'AHUs', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Transformers', scopes: [ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'MDBs', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
      ],
    },
    {
      email: 'elvsolutions@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'ELV Solutions & ICT Systems',
      tradeLicenseNo: 'TL-ELV-004',
      taxRegistrationNo: 'TX-ELV-666',
      ownerName: 'Clara Oswald',
      phone: '+971504445555',
      address: 'Silicon Oasis HQ, Wing B',
      city: 'Dubai',
      country: 'UAE',
      status: VendorStatus.APPROVED,
      businessCategory: 'Sub-Contractor',
      services: [
        { name: 'Structured Cabling', scopes: [ScopeOfWork.INSTALLATION] },
        { name: 'CCTV', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'Access Control', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'Building Management System (BMS)', scopes: [ScopeOfWork.DESIGN_ENGINEERING, ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
      ],
    },
    {
      email: 'flowplumbing@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'Flow Plumbing & Filtration Ltd',
      tradeLicenseNo: 'TL-FLW-005',
      taxRegistrationNo: 'TX-FLW-555',
      ownerName: 'Mario Rossi',
      phone: '+971505556666',
      address: 'Waterfront Lane, Warehouse A',
      city: 'Jebel Ali',
      country: 'UAE',
      status: VendorStatus.APPROVED,
      businessCategory: 'Sub-Contractor',
      services: [
        { name: 'Booster Pump Systems', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'Soil & Waste Systems', scopes: [ScopeOfWork.INSTALLATION] },
        { name: 'RO Plants', scopes: [ScopeOfWork.DESIGN_ENGINEERING, ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
      ],
    },
    {
      email: 'glassclad@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'GlassClad Facades & Glazing',
      tradeLicenseNo: 'TL-GLS-006',
      taxRegistrationNo: 'TX-GLS-444',
      ownerName: 'Sarah Jenkins',
      phone: '+971506667777',
      address: 'Glassworks Industrial Zone',
      city: 'Ras Al Khaimah',
      country: 'UAE',
      status: VendorStatus.PENDING,
      businessCategory: 'Sub-Contractor',
      services: [
        { name: 'Curtain Walls', scopes: [ScopeOfWork.DESIGN_ENGINEERING, ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Stick Facade', scopes: [ScopeOfWork.INSTALLATION] },
        { name: 'Aluminum Cladding', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
      ],
    },
    {
      email: 'roadtech@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'RoadTech Infrastructure Contracting',
      tradeLicenseNo: 'TL-ROD-007',
      taxRegistrationNo: 'TX-ROD-333',
      ownerName: 'William McAdam',
      phone: '+971507778888',
      address: 'Highway Corridor 5',
      city: 'Al Ain',
      country: 'UAE',
      status: VendorStatus.APPROVED,
      businessCategory: 'Contractor',
      services: [
        { name: 'Road Construction', scopes: [ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'Asphalt Paving', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Sewer Networks', scopes: [ScopeOfWork.INSTALLATION] },
        { name: 'Stormwater Networks', scopes: [ScopeOfWork.INSTALLATION] },
      ],
    },
    {
      email: 'johndoe@vms.com',
      vendorType: VendorType.INDIVIDUAL,
      ownerName: 'John Doe',
      phone: '+971508889999',
      address: 'Finishing District, Apt 3A',
      city: 'Fujairah',
      country: 'UAE',
      status: VendorStatus.APPROVED,
      businessCategory: 'Technician',
      services: [
        { name: 'Floor Finishes', scopes: [ScopeOfWork.INSTALLATION] },
        { name: 'Wall Finishes', scopes: [ScopeOfWork.INSTALLATION] },
        { name: 'Painting', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
      ],
    },
    {
      email: 'specialized@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'Specialized Engineering Systems Ltd',
      tradeLicenseNo: 'TL-SPC-009',
      taxRegistrationNo: 'TX-SPC-222',
      ownerName: 'Elena Rostova',
      phone: '+971509990000',
      address: 'Science & Technology Park',
      city: 'Dubai',
      country: 'UAE',
      status: VendorStatus.REJECTED,
      businessCategory: 'Sub-Contractor',
      services: [
        { name: 'Medical Gas Systems', scopes: [ScopeOfWork.DESIGN_ENGINEERING, ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
        { name: 'Baggage Handling Systems', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Clean Agent Fire Suppression', scopes: [ScopeOfWork.DESIGN_ENGINEERING, ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION, ScopeOfWork.TESTING_COMMISSIONING] },
      ],
    },
    {
      email: 'tempworks@vms.com',
      vendorType: VendorType.COMPANY,
      companyName: 'TempWorks Scaffold & Shoring Ltd',
      tradeLicenseNo: 'TL-TMP-010',
      taxRegistrationNo: 'TX-TMP-111',
      ownerName: 'Robert Scaff',
      phone: '+971501110000',
      address: 'Temporary Depot Road',
      city: 'Sharjah',
      country: 'UAE',
      status: VendorStatus.PENDING,
      businessCategory: 'Sub-Contractor',
      services: [
        { name: 'Shoring', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Sheet Piling', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
        { name: 'Scaffolding', scopes: [ScopeOfWork.SUPPLY, ScopeOfWork.INSTALLATION] },
      ],
    },
  ];

  for (const vData of vendorsData) {
    const user = await prisma.user.create({
      data: {
        email: vData.email,
        password: hashedVendorPassword,
        role: Role.VENDOR,
      },
    });

    const completion = getProfileCompletion({
      vendorType: vData.vendorType,
      ownerName: vData.ownerName,
      phone: vData.phone,
      address: vData.address,
      city: vData.city,
      country: vData.country,
      companyName: vData.companyName || null,
      tradeLicenseNo: vData.tradeLicenseNo || null,
      taxRegistrationNo: vData.taxRegistrationNo || null,
      hasServices: vData.services.length > 0,
    });

    const profile = await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        vendorType: vData.vendorType,
        companyName: vData.companyName || null,
        tradeLicenseNo: vData.tradeLicenseNo || null,
        taxRegistrationNo: vData.taxRegistrationNo || null,
        ownerName: vData.ownerName,
        phone: vData.phone,
        address: vData.address,
        city: vData.city,
        region: (vData as any).region || null,
        country: vData.country,
        status: vData.status,
        profileCompletion: completion,
        businessCategory: vData.businessCategory,
      },
    });

    for (const serviceMap of vData.services) {
      const subCatId = subCategoryMap[serviceMap.name];
      if (subCatId) {
        await prisma.vendorService.create({
          data: {
            vendorProfileId: profile.id,
            subCategoryId: subCatId,
            scopes: serviceMap.scopes,
          },
        });
      } else {
        console.warn(`⚠️ Warning: Subcategory "${serviceMap.name}" not found in database maps.`);
      }
    }
    console.log(`  Seeded Vendor user: ${vData.email} (Completion: ${completion}%)`);
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
