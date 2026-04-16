import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { rust } from '@codemirror/lang-rust';
import { StreamLanguage } from '@codemirror/language';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { go } from '@codemirror/lang-go';

export const LANGUAGES = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node)',
    extension: '.js',
    cmExtension: () => javascript(),
    pistonRuntime: { language: 'javascript', version: '18.15.0' },
    defaultCode: `console.log("Hello from NodeJS!");\n`
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    extension: '.ts',
    cmExtension: () => javascript({ typescript: true }),
    pistonRuntime: { language: 'typescript', version: '5.0.3' },
    defaultCode: `const msg: string = "Hello TypeScript!";\nconsole.log(msg);\n`
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    cmExtension: () => cpp(),
    pistonRuntime: { language: 'c++', version: '10.2.0' },
    defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello C++!" << endl;\n    return 0;\n}`
  },
  c: {
    id: 'c',
    name: 'C',
    extension: '.c',
    cmExtension: () => cpp(),
    pistonRuntime: { language: 'c', version: '10.2.0' },
    defaultCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello C!\\n");\n    return 0;\n}`
  },
  python: {
    id: 'python',
    name: 'Python',
    extension: '.py',
    cmExtension: () => python(),
    pistonRuntime: { language: 'python', version: '3.10.0' },
    defaultCode: `print("Hello Python!")\n`
  },
  java: {
    id: 'java',
    name: 'Java',
    extension: '.java',
    cmExtension: () => java(),
    pistonRuntime: { language: 'java', version: '15.0.2' },
    defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java!");\n    }\n}`
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    extension: '.rs',
    cmExtension: () => rust(),
    pistonRuntime: { language: 'rust', version: '1.68.2' },
    defaultCode: `fn main() {\n    println!("Hello Rust!");\n}`
  },
  go: {
    id: 'go',
    name: 'Go',
    extension: '.go',
    cmExtension: () => go(),
    pistonRuntime: { language: 'go', version: '1.16.2' },
    defaultCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello Go!")\n}`
  },
  bash: {
    id: 'bash',
    name: 'Bash',
    extension: '.sh',
    cmExtension: () => StreamLanguage.define(shell),
    pistonRuntime: { language: 'bash', version: '5.2.0' },
    defaultCode: `#!/bin/bash\necho "Hello Bash!"\n`
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    extension: '.rb',
    cmExtension: () => StreamLanguage.define(ruby),
    pistonRuntime: { language: 'ruby', version: '3.0.1' },
    defaultCode: `puts "Hello Ruby!"\n`
  }
};

export const getLanguageByExtension = (filename) => {
  const ext = filename.slice(filename.lastIndexOf('.'));
  const found = Object.values(LANGUAGES).find(l => l.extension === ext);
  return found ? found.id : 'javascript';
};
