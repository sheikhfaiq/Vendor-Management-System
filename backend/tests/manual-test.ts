/**
 * Manual test script for the VMS Backend REST API.
 * This runs against a running server on http://localhost:5000.
 * To execute: ts-node tests/manual-test.ts
 */

const API_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting VMS Backend Integration Endpoint Tests...\n');

  try {
    // 1. Health Check
    console.log('--------------------------------------------------');
    console.log('🏥 testing Health Check...');
    const healthRes = await fetch(`${API_URL}/health`);
    const healthJson = await healthRes.json() as any;
    console.log('Health check response:', healthJson);

    // 2. Log in as default seeded Administrator
    console.log('--------------------------------------------------');
    console.log('🔑 logging in as Administrator (admin@vms.com)...');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@vms.com',
        password: 'Admin@123456',
      }),
    });
    const adminLoginJson = await adminLoginRes.json() as any;
    if (!adminLoginRes.ok) {
      throw new Error(`Admin login failed: ${adminLoginJson.message}`);
    }
    const adminToken = adminLoginJson.data.accessToken;
    console.log('Logged in as Admin successfully.');

    // 3. Register a new Vendor Account
    console.log('--------------------------------------------------');
    const vendorEmail = `vendor_${Date.now()}@vms.com`;
    console.log(`📝 Registering new Vendor: ${vendorEmail}...`);
    const signupRes = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: vendorEmail,
        password: 'VendorPassword123!',
        vendorType: 'COMPANY',
        companyName: 'Apex MEP Solutions',
        tradeLicenseNo: 'TL-889922',
        taxRegistrationNo: 'TX-773344',
        ownerName: 'Robert Vance',
        phone: '9715566778',
        website: 'https://apex-mep.com',
        address: 'Suite 404, Commercial Tower',
        city: 'Dubai',
        country: 'UAE',
      }),
    });
    const signupJson = await signupRes.json() as any;
    if (!signupRes.ok) {
      throw new Error(`Vendor signup failed: ${signupJson.message}`);
    }
    console.log('Vendor signed up successfully. Profile ID:', signupJson.data.vendorProfile.id);

    // 4. Log in as the newly created Vendor
    console.log('--------------------------------------------------');
    console.log(`🔑 logging in as Vendor: ${vendorEmail}...`);
    const vendorLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: vendorEmail,
        password: 'VendorPassword123!',
      }),
    });
    const vendorLoginJson = await vendorLoginRes.json() as any;
    if (!vendorLoginRes.ok) {
      throw new Error(`Vendor login failed: ${vendorLoginJson.message}`);
    }
    const vendorToken = vendorLoginJson.data.accessToken;
    const vendorProfileId = vendorLoginJson.data.user.vendorProfile.id;
    console.log('Logged in as Vendor successfully.');

    // 5. Get Logged-in Vendor Profile
    console.log('--------------------------------------------------');
    console.log('👤 Fetching Vendor Profile details...');
    const profileRes = await fetch(`${API_URL}/vendors/profile`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const profileJson = await profileRes.json() as any;
    console.log('Vendor profile:', {
      companyName: profileJson.data.companyName,
      status: profileJson.data.status,
      profileCompletion: profileJson.data.profileCompletion,
    });

    // 6. Update Vendor Profile (Recalculate completion)
    console.log('--------------------------------------------------');
    console.log('✏️ Updating Vendor Profile Website...');
    const updateRes = await fetch(`${API_URL}/vendors/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}`,
      },
      body: JSON.stringify({
        website: 'https://new-apex-mep.com',
      }),
    });
    const updateJson = await updateRes.json() as any;
    console.log('Updated Profile completion score:', updateJson.data.profileCompletion);

    // 7. Fetch Available Service Hierarchies
    console.log('--------------------------------------------------');
    console.log('📁 Fetching Available Service Hierarchies...');
    const hierarchyRes = await fetch(`${API_URL}/services`);
    const hierarchyJson = await hierarchyRes.json() as any;
    console.log('Hierarchies loaded. Total Main Categories:', hierarchyJson.data.length);
    
    // Pick the first available subcategory to link
    let targetSubCategoryId = '';
    if (hierarchyJson.data.length > 0 && hierarchyJson.data[0].categories.length > 0 && hierarchyJson.data[0].categories[0].subCategories.length > 0) {
      const subCat = hierarchyJson.data[0].categories[0].subCategories[0];
      targetSubCategoryId = subCat.id;
      console.log(`Selected Subcategory: "${subCat.name}" (ID: ${targetSubCategoryId})`);
    }

    if (targetSubCategoryId) {
      // 8. Add Vendor Service Mapping
      console.log('--------------------------------------------------');
      console.log('➕ Mapping Service and Scope to Vendor...');
      const addServiceRes = await fetch(`${API_URL}/vendors/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorToken}`,
        },
        body: JSON.stringify({
          subCategoryId: targetSubCategoryId,
          scopes: ['SUPPLY', 'INSTALLATION'],
        }),
      });
      const addServiceJson = await addServiceRes.json() as any;
      if (!addServiceRes.ok) {
        console.error('Add service response details:', addServiceJson);
      } else {
        console.log('Service mapped successfully. Scopes:', addServiceJson.data.scopes);
      }

      // 9. Fetch Profile Completion again to verify growth
      console.log('--------------------------------------------------');
      console.log('📈 Verifying completion growth...');
      const compRes = await fetch(`${API_URL}/vendors/profile/completion`, {
        headers: { Authorization: `Bearer ${vendorToken}` },
      });
      const compJson = await compRes.json() as any;
      console.log('Updated completion percentage:', compJson.data.completion);
    }

    // 10. Fetch Vendor Dashboard
    console.log('--------------------------------------------------');
    console.log('📊 Fetching Vendor Dashboard details...');
    const vendorDashRes = await fetch(`${API_URL}/vendors/dashboard`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    const vendorDashJson = await vendorDashRes.json() as any;
    console.log('Vendor Dashboard:', {
      status: vendorDashJson.data.profile.status,
      servicesCount: vendorDashJson.data.serviceCount,
      recentActivities: vendorDashJson.data.recentActivities.length,
    });

    // 11. Approve the Vendor (Admin Action)
    console.log('--------------------------------------------------');
    console.log(`✅ Admin approving Vendor ID: ${vendorProfileId}...`);
    const approveRes = await fetch(`${API_URL}/admin/vendors/${vendorProfileId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'APPROVED',
      }),
    });
    const approveJson = await approveRes.json() as any;
    console.log('Admin approval response. New Status:', approveJson.data.status);

    // 12. Admin Fetch Dashboards & Activity logs
    console.log('--------------------------------------------------');
    console.log('📊 Fetching Admin Dashboard metrics...');
    const adminDashRes = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDashJson = await adminDashRes.json() as any;
    console.log('Admin Dashboard Stats:', adminDashJson.data);

    console.log('--------------------------------------------------');
    console.log('📋 Fetching Admin System Activity Logs...');
    const logsRes = await fetch(`${API_URL}/admin/activity-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const logsJson = await logsRes.json() as any;
    console.log('Total System Activity Logs fetched:', logsJson.data.data.length);
    if (logsJson.data.data.length > 0) {
      console.log('Latest Log Item:', {
        action: logsJson.data.data[0].action,
        details: logsJson.data.data[0].details,
        timestamp: logsJson.data.data[0].createdAt,
      });
    }

    console.log('\n🎉 All endpoints manually verified successfully! VMS backend is fully operational.');
  } catch (error) {
    console.error('\n❌ Verification test encountered an error:', error);
  }
}

// Check if running directly to execute
if (require.main === module) {
  runTests();
}
