const id = ObjectId('697698b6a93134feaf59b5ca');
print('Order:');
printjson(db.orders.findOne({ _id: id }, { orderNumber: 1, paymentStatus: 1, status: 1, paymentIntentId: 1, paymentProvider: 1, createdAt: 1 }));
print('\nPayments:');
db.payments.find({ order: id }).forEach(p => printjson(p));
print('\nWebhook events:');
db.webhookevents.find({}).sort({ createdAt: -1 }).limit(5).forEach(e => printjson(e));
