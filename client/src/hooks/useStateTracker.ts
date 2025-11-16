// client/src/hooks/useStateTracker.ts
import { useEffect, useRef } from "react";

export const useStateTracker = (componentName: string, state: any) => {
  const prevState = useRef(state);

  useEffect(() => {
    if (JSON.stringify(prevState.current) !== JSON.stringify(state)) {
      console.group(`🔄 ${componentName} State Changed`);
      console.log("⬅️ Previous:", prevState.current);
      console.log("➡️ Current:", state);

      // מצא מה השתנה
      const changes = findChanges(prevState.current, state);
      if (changes.length > 0) {
        console.log("📝 Changes:", changes);
      }

      console.groupEnd();

      prevState.current = state;
    }
  }, [state, componentName]);
};

// 🔍 Hook לעקוב אחרי props
export const usePropsTracker = (componentName: string, props: any) => {
  const prevProps = useRef(props);

  useEffect(() => {
    const changes = findChanges(prevProps.current, props);
    if (changes.length > 0) {
      console.group(`📦 ${componentName} Props Changed`);
      console.log("📝 Changes:", changes);
      console.log("⬅️ Previous:", prevProps.current);
      console.log("➡️ Current:", props);
      console.groupEnd();

      prevProps.current = props;
    }
  });
};

// 🎯 Hook לעקוב אחרי renders
export const useRenderTracker = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - startTime.current;

    console.log(
      `🎨 ${componentName} Render #${renderCount.current} ` +
        `(${timeSinceLastRender}ms since last render)`
    );

    startTime.current = now;
  });

  return renderCount.current;
};

function findChanges(prev: any, current: any, path = ""): string[] {
  const changes: string[] = [];

  if (typeof prev !== typeof current) {
    changes.push(
      `${path}: type changed from ${typeof prev} to ${typeof current}`
    );
    return changes;
  }

  if (typeof current === "object" && current !== null) {
    for (const key in current) {
      const newPath = path ? `${path}.${key}` : key;

      if (!(key in prev)) {
        changes.push(`${newPath}: added`);
      } else if (prev[key] !== current[key]) {
        if (typeof current[key] === "object") {
          changes.push(...findChanges(prev[key], current[key], newPath));
        } else {
          changes.push(`${newPath}: ${prev[key]} → ${current[key]}`);
        }
      }
    }

    for (const key in prev) {
      if (!(key in current)) {
        const newPath = path ? `${path}.${key}` : key;
        changes.push(`${newPath}: removed`);
      }
    }
  } else if (prev !== current) {
    changes.push(`${path}: ${prev} → ${current}`);
  }

  return changes;
}
