// 🎯 שמואל: בואו נבין מה זה Express - מהבסיס!

// Express זה פשוט ספרייה שעוזרת ליצור שרת HTTP
const express = require('express');

console.log("🏗️ יוצר שרת Express...");

// יוצר "אפליקציה" - זה בעצם השרת שלנו
const app = express();

console.log("📡 מגדיר נתיבים (routes)...");

// נתיב פשוט - מה קורה כשמישהו נכנס לכתובת
app.get('/', (req, res) => {
  console.log("👋 מישהו ביקר בעמוד הבית!");
  res.send('<h1>שלום שמואל! זה השרת שלך!</h1>');
});

// נתיב נוסף
app.get('/shmuel', (req, res) => {
  console.log("🎯 מישהו ביקר בדף שמואל!");
  res.json({ 
    message: "זה הדף של שמואל!", 
    time: new Date().toLocaleString(),
    success: true 
  });
});

// נתיב עם פרמטר
app.get('/hello/:name', (req, res) => {
  const name = req.params.name; // לוקח את השם מהURL
  console.log(`👋 מישהו רוצה לומר שלום ל-${name}`);
  res.json({ message: `שלום ${name}!` });
});

// מה קורה כשמישהו שולח POST (למשל מטופס)
app.post('/message', (req, res) => {
  console.log("📨 מישהו שלח הודעה!");
  res.json({ message: "קיבלתי את ההודעה!" });
});

// מה קורה כשמבקשים דף שלא קיים
app.use((req, res) => {
  console.log(`❓ מישהו חיפש ${req.url} - לא קיים!`);
  res.status(404).send('העמוד לא נמצא!');
});

// מתחיל להקשיב על פורט 3333
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 השרת רץ על http://localhost:${PORT}`);
  console.log("📝 נסה לגלוש ל:");
  console.log(`   - http://localhost:${PORT}/`);
  console.log(`   - http://localhost:${PORT}/shmuel`);
  console.log(`   - http://localhost:${PORT}/hello/שמואל`);
  console.log("🛑 לעצירה: Ctrl+C");
});

// 🎯 מה ללמוד מזה:
// 1. Express זה דרך פשוטה ליצור שרת
// 2. app.get/post = מה לעשות כשמגיעה בקשה
// 3. req = מה שהלקוח שלח
// 4. res = מה שאנחנו מחזירים
// 5. app.listen = מתחיל לחכות לבקשות