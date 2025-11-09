// 🎯 שמואל: בואו נבין async/await בלי שטויות!

console.log("🚀 התחלנו!");

// 1. פונקציה רגילה - מיידית
function normalFunction() {
  console.log("זה קורה מיד!");
  return "תוצאה מיידית";
}

// 2. פונקציה שלוקחת זמן (מדמה שרת איטי)
function slowFunction() {
  console.log("מתחיל משימה איטה...");
  
  // setTimeout מדמה משהו שלוקח זמן (כמו שליחה לשרת)
  setTimeout(() => {
    console.log("סיימתי את המשימה האיטה!");
  }, 2000); // 2 שניות
  
  return "חזרתי מיד (אבל המשימה עוד לא סיימה!)";
}

// 3. Promise - דרך לחכות למשהו שלוקח זמן
function promiseFunction() {
  console.log("מתחיל Promise...");
  
  return new Promise((resolve, reject) => {
    console.log("עובד על המשימה...");
    
    setTimeout(() => {
      // אחרי 2 שניות - נגיד שסיימנו
      resolve("Promise הושלם בהצלחה!");
    }, 2000);
  });
}

// 4. async/await - דרך נקייה לכתוב קוד אסינכרוני
async function asyncFunction() {
  console.log("מתחיל async function...");
  
  try {
    console.log("חוכה לPromise...");
    const result = await promiseFunction(); // חכה עד שזה מסתיים!
    console.log("קיבלתי:", result);
    return result;
  } catch (error) {
    console.log("שגיאה:", error);
  }
}

// בואו נריץ הכל ונראה מה קורה!
console.log("\n=== בדיקה 1: פונקציה רגילה ===");
const result1 = normalFunction();
console.log("תוצאה:", result1);

console.log("\n=== בדיקה 2: פונקציה איטה (לא חוכה) ===");
const result2 = slowFunction();
console.log("תוצאה:", result2);

console.log("\n=== בדיקה 3: Promise עם async/await ===");
asyncFunction().then(finalResult => {
  console.log("התוצאה הסופית:", finalResult);
  console.log("\n🎉 סיימנו! עכשיו אתה מבין את ההבדל!");
});

console.log("זה יודפס לפני שה-Promise מסתיים!");

// 🎯 מה ללמוד מזה:
// 1. קוד רגיל רץ מלמעלה למטה
// 2. setTimeout לא עוצר את הקוד - ממשיך הלאה
// 3. Promise אומר "אני אחזור אליך כשאסיים"
// 4. async/await עושה את הקוד נראה רגיל אבל עדיין אסינכרוני