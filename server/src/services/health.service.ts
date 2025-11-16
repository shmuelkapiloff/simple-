

// tools/check-db.js// tools/check-db.js
const { MongoClient } = require('mongodb');

async function checkDatabase() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('simple_shop');
        
        console.log('🔍 בודק מסד נתונים...\n');
        
        // קולקשנים
        const collections = await db.listCollections().toArray();
        console.log('📂 קולקשנים:\n', collections.map(c => c.name));
        
        // מוצרים
        const productsCount = await db.collection('products').countDocuments();
        console.log(`📦 מוצרים:\n ${productsCount}`);
        
        // עגלות
        const cartsCount = await db.collection('carts').countDocuments();
        console.log(`🛒 עגלות: ${cartsCount}`);
        
        if (cartsCount > 0) {
            const carts = await db.collection('carts').find().toArray();
            console.log('\n🛒 עגלות קיימות:');
            carts.forEach(cart => {
                console.log(`  - Session: ${cart.sessionId}, פריטים: ${cart.items?.length || 0}`);
            });
        }
        
    } catch (error) {
        console.error('❌ שגיאה:', error);
    } finally {
        await client.close();
    }
}

checkDatabase();
