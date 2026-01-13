// Debug hooks - disabled in production
// These hooks were used during development for debugging state and prop changes
// To use them, uncomment the console.log calls below

export const useStateTracker = (_componentName: string, _state: any) => {
  // Debug hook - disabled
};

export const usePropsTracker = (_componentName: string, _props: any) => {
  // Debug hook - disabled
};

export const useRenderTracker = (_componentName: string) => {
  // Debug hook - disabled
  return 0;
};
