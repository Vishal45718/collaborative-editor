import { create } from 'zustand';

export const useIdeStore = create((set) => ({
  // Active states
  activeFile: null,
  activeLanguage: 'javascript', // derived from active file usually
  setActiveFile: (fileId) => set({ activeFile: fileId }),
  setActiveLanguage: (lang) => set({ activeLanguage: lang }),

  // Layout states
  leftPanelSize: 20,
  bottomPanelSize: 25,
  setLeftPanelSize: (size) => set({ leftPanelSize: size }),
  setBottomPanelSize: (size) => set({ bottomPanelSize: size }),

  // Execution states
  executionOutput: 'Ready to run.',
  executionError: false,
  isRunning: false,
  stdin: '',
  setExecutionOutput: (output, isError = false) => set({ executionOutput: output, executionError: isError }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setStdin: (stdin) => set({ stdin }),

  // Execution config
  timeout: 5000,
  memoryLimit: 512,
  setTimeout: (val) => set({ timeout: val }),
  setMemoryLimit: (val) => set({ memoryLimit: val })
}));
