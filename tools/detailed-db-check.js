// tools/detailed-db-check.js
const { MongoClient } = require('mongodb');
const redis = require('redis');

async function detailedDatabaseCheck() {
    console.log('🔍 בדיקה מפורטת של מסד הנתונים...\n');
    
    // MongoDB Check
    const mongoClient = new MongoClient('mongodb://localhost:27017');
    let redisClient;
    
    try {
        // חיבור MongoDB
        await mongoClient.connect();
        const db = mongoClient.db('simple_shop');
        console.log('✅ MongoDB מחובר\n');
        
        // בדיקת קולקשנים
        const collections = await db.listCollections().toArray();
        console.log('📂 קולקשנים זמינים:', collections.map(c => c.name).join(', '));
        console.log('=' * 60);
        
        // מוצרים מפורט
        console.log('\n📦 מוצרים:');
        const products = await db.collection('products').find().toArray();
        console.log(`   סה"כ מוצרים: ${products.length}`);
        
        products.forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.name}`);
            console.log(`      💰 מחיר: $${product.price}`);
            console.log(`      🏷️ SKU: ${product.sku}`);
            console.log(`      📂 קטגוריה: ${product.category}`);
            console.log(`      📊 מלאי: ${product.stock || 'לא מוגדר'}`);
            if (product.image) console.log(`      🖼️ תמונה: ${product.image.substring(0, 50)}...`);
            console.log('      ' + '-'.repeat(40));
        });
        
        // עגלות מפורט
        console.log('\n🛒 עגלות:');
        const carts = await db.collection('carts').find().toArray();
        console.log(`   סה"כ עגלות: ${carts.length}`);
        
        if (carts.length === 0) {
            console.log('   📝 אין עגלות פעילות כרגע');
        } else {
            carts.forEach((cart, index) => {
                console.log(`   ${index + 1}. Session ID: ${cart.sessionId}`);
                console.log(`      📅 נוצר: ${cart.createdAt ? new Date(cart.createdAt).toLocaleString('he-IL') : 'לא מוגדר'}`);
                console.log(`      🔄 עודכן: ${cart.updatedAt ? new Date(cart.updatedAt).toLocaleString('he-IL') : 'לא מוגדר'}`);
                console.log(`      💰 סה"כ: $${cart.total || 0}`);
                console.log(`      📦 פריטים (${cart.items?.length || 0}):`);
                
                if (cart.items && cart.items.length > 0) {
                    cart.items.forEach((item, itemIndex) => {
                        console.log(`         ${itemIndex + 1}. Product ID: ${item.productId}`);
                        console.log(`            📦 כמות: ${item.quantity}`);
                        console.log(`            💰 מחיר יחידה: $${item.price || 'לא מוגדר'}`);
                        console.log(`            📝 שם: ${item.name || 'לא מוגדר'}`);
                    });
                } else {
                    console.log('         📝 עגלה ריקה');
                }
                console.log('      ' + '-'.repeat(40));
            });
        }
        
        // סטטיסטיקות כלליות
        console.log('\n📊 סטטיסטיקות:');
        const stats = await db.stats();
        console.log(`   💾 גודל מסד נתונים: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   📄 מספר אובייקטים: ${stats.objects}`);
        console.log(`   📑 מספר אינדקסים: ${stats.indexes}`);
        
        // אינדקסים
        console.log('\n🔗 אינדקסים:');
        const productIndexes = await db.collection('products').getIndexes();
        console.log('   Products:', Object.keys(productIndexes).join(', '));
        
        const cartIndexes = await db.collection('carts').getIndexes();
        console.log('   Carts:', Object.keys(cartIndexes).join(', '));
        
    } catch (error) {
        console.error('❌ שגיאה ב-MongoDB:', error.message);
    } finally {
        await mongoClient.close();
    }
    
    // Redis Check
    console.log('\n' + '='.repeat(60));
    console.log('📧 בדיקת Redis Cache...\n');
    
    try {
        redisClient = redis.createClient({ url: 'redis://localhost:6379' });
        await redisClient.connect();
        console.log('✅ Redis מחובר');
        
        // כל המפתחות
        const keys = await redisClient.keys('*');
        console.log(`🗝️ מספר מפתחות ב-Cache: ${keys.length}`);
        
        if (keys.length === 0) {
            console.log('📝 Cache ריק (זה תקין)');
        } else {
            console.log('\n🗂️ מפתחות קיימים:');
            for (const key of keys) {
                const type = await redisClient.type(key);
                const ttl = await redisClient.ttl(key);
                const value = await redisClient.get(key);
                
                console.log(`   ${key}`);
                console.log(`      📝 סוג: ${type}`);
                console.log(`      ⏰ TTL: ${ttl === -1 ? 'ללא תפוגה' : `${ttl} שניות`}`);
                
                if (value) {
                    try {
                        const parsed = JSON.parse(value);
                        console.log(`      📊 תוכן: עגלה עם ${parsed.items?.length || 0} פריטים`);
                        console.log(`      💰 סה"כ: $${parsed.total || 0}`);
                    } catch {
                        console.log(`      📄 תוכן: ${value.substring(0, 100)}...`);
                    }
                }
                console.log('      ' + '-'.repeat(30));
            }
        }
        
        // מידע על Redis
        const info = await redisClient.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        if (memoryMatch) {
            console.log(`\n💾 שימוש בזיכרון: ${memoryMatch[1].trim()}`);
        }
        
    } catch (error) {
        console.error('❌ שגיאה ב-Redis:', error.message);
        console.log('💡 ודא ש-Redis Server רץ');
    } finally {
        if (redisClient) {
            await redisClient.quit();
        }
    }
    
    console.log('\n🎉 בדיקה הושלמה!');
}

// הרצה
detailedDatabaseCheck().catch(console.error);