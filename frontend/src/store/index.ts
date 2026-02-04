import { create } from 'zustand';

interface EditorState {
  fileType: 'person' | 'company' | 'job';
  selectedFile: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
}

interface AppState {
  // Active tab
  activeTab: 'data-manager' | 'review' | 'build' | 'results';
  setActiveTab: (tab: 'data-manager' | 'review' | 'build' | 'results') => void;

  // Editor state
  editor: EditorState;
  setEditorFileType: (fileType: 'person' | 'company' | 'job') => void;
  setEditorFile: (file: string, content: string) => void;
  setEditorContent: (content: string) => void;
  resetEditor: () => void;
  markEditorClean: () => void;

  // Selected items (persisted across tabs)
  selectedPerson: string;
  selectedCompany: string;
  selectedJob: string;
  setSelectedPerson: (person: string) => void;
  setSelectedCompany: (company: string) => void;
  setSelectedJob: (job: string) => void;
}

const initialEditorState: EditorState = {
  fileType: 'person',
  selectedFile: '',
  content: '',
  originalContent: '',
  isDirty: false,
};

export const useAppStore = create<AppState>((set) => ({
  // Active tab
  activeTab: 'data-manager',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Editor state
  editor: initialEditorState,
  setEditorFileType: (fileType) =>
    set(() => ({
      editor: {
        ...initialEditorState,
        fileType,
      },
    })),
  setEditorFile: (file, content) =>
    set((state) => ({
      editor: {
        ...state.editor,
        selectedFile: file,
        content,
        originalContent: content,
        isDirty: false,
      },
    })),
  setEditorContent: (content) =>
    set((state) => ({
      editor: {
        ...state.editor,
        content,
        isDirty: content !== state.editor.originalContent,
      },
    })),
  resetEditor: () =>
    set((state) => ({
      editor: {
        ...state.editor,
        content: state.editor.originalContent,
        isDirty: false,
      },
    })),
  markEditorClean: () =>
    set((state) => ({
      editor: {
        ...state.editor,
        originalContent: state.editor.content,
        isDirty: false,
      },
    })),

  // Selected items
  selectedPerson: '',
  selectedCompany: '',
  selectedJob: '',
  setSelectedPerson: (person) => set({ selectedPerson: person }),
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  setSelectedJob: (job) => set({ selectedJob: job }),
}));
