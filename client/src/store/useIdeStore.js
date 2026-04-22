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
  executionOutput: 'Ready to run. Press ▶ Run to execute your code.',
  executionError: false,
  isRunning: false,
  stdin: '',
  setExecutionOutput: (output, isError = false) => set({ executionOutput: output, executionError: isError }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setStdin: (stdin) => set({ stdin }),

  // Output panel tab: 'run' | 'terminal'
  activeOutputTab: 'run',
  setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),
}));
