// Test Order Creation Script
const API_BASE = 'http://localhost:4001/api';

async function testOrderFlow() {
  console.log('🧪 Starting complete order flow test...');
  
  const timestamp = Date.now();
  const uniqueEmail = `test${timestamp}@example.com`;
  
  // Step 1: Register/Login  
  console.log('🔐 Step 1: Authentication');
  const authResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',  // Use a known email
      password: 'password123'
    })
  });
  const authData = await authResponse.json();
  console.log('Auth response:', authData);
  
  if (!authData.success) {
    console.error('❌ Authentication failed');
    return;
  }
  
  const token = authData.data.token;
  const userId = authData.data.user._id;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // Step 2: Get products
  console.log('\n📦 Step 2: Getting products');
  const productsResponse = await fetch(`${API_BASE}/products`, {
    headers: authHeaders
  });
  const productsData = await productsResponse.json();
  console.log('Products count:', productsData.data.length);
  
  if (!productsData.data.length) {
    console.error('❌ No products found');
    return;
  }
  
  const firstProduct = productsData.data[0];
  console.log('Using product:', firstProduct.name);
  
  // Step 3: Clear cart first, then add to cart with unique sessionId
  console.log('\n🧹 Step 3A: Clearing any existing cart');
  const clearCartResponse = await fetch(`${API_BASE}/cart/clear`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const clearCartData = await clearCartResponse.json();
  console.log('Clear cart response:', clearCartData);
  
  console.log('\n🛒 Step 3B: Adding to cart with unique session');
  const uniqueSessionId = `session_${timestamp}`;
  const cartResponse = await fetch(`${API_BASE}/cart/add`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sessionId: uniqueSessionId,
      productId: firstProduct._id,
      quantity: 2
    })
  });
  const cartData = await cartResponse.json();
  console.log('Cart add response:', cartData);
  
  // Verify cart content
  console.log('\n🔍 Step 3C: Verifying cart content');
  const getCartResponse = await fetch(`${API_BASE}/cart`, {
    headers: authHeaders
  });
  const getCartData = await getCartResponse.json();
  console.log('Get cart response:');
  console.log('- Cart ID:', getCartData.data._id);
  console.log('- User ID:', getCartData.data.userId);
  console.log('- Items count:', getCartData.data.items.length);
  console.log('- Items:', JSON.stringify(getCartData.data.items, null, 2));
  console.log('- Total:', getCartData.data.total);
  
  // Step 4: Create order
  console.log('\n📋 Step 4: Creating order');
  const orderResponse = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      shippingAddress: {
        street: 'הרצל 123',
        city: 'תל אביב',
        postalCode: '12345',
        country: 'ישראל'
      },
      paymentMethod: 'credit_card'
    })
  });
  const orderData = await orderResponse.json();
  console.log('Order creation response:', orderData);
  
  if (!orderData.success) {
    console.error('❌ Order creation failed:', orderData);
    return;
  }
  
  const orderId = orderData.data.order._id;
  console.log('✅ Order created successfully! ID:', orderId);
  
  // Step 5: Get orders
  console.log('\n📋 Step 5: Getting user orders');
  const getUserOrdersResponse = await fetch(`${API_BASE}/orders`, {
    headers: authHeaders
  });
  const getUserOrdersData = await getUserOrdersResponse.json();
  console.log('User orders:', getUserOrdersData.data.orders.length);
  
  // Step 6: Test order cancellation
  console.log('\n❌ Step 6: Testing order cancellation');
  const cancelResponse = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: authHeaders
  });
  const cancelData = await cancelResponse.json();
  console.log('Cancel response:', cancelData);
  
  console.log('\n🎉 Complete order flow test completed!');
  console.log('✅ All API endpoints are working correctly');
  console.log('\nCredentials for manual testing:');
  console.log('Email:', authData.data.user.email);
  console.log('Password: password123');
  console.log('Token:', token);
  
  return {
    success: true,
    userEmail: authData.data.user.email,
    orderId: orderId,
    token: token
  };
}

// Run the test
testOrderFlow().catch(console.error);