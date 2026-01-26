export type MenuItem = {
  id: string
  label: string
  shortcut?: string
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  {
    id: 'file',
    label: 'File',
    children: [
      { id: 'new', label: 'New', shortcut: 'Ctrl+N' },
      { id: 'open', label: 'Open', shortcut: 'Ctrl+O' },
      { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
      { id: 'export', label: 'Export', shortcut: 'Ctrl+E' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    children: [
      { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
      { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y' },
      { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
      { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
      { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    children: [
      { id: 'zoom-in', label: 'Zoom In', shortcut: 'Ctrl++' },
      { id: 'zoom-out', label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { id: 'fullscreen', label: 'Fullscreen', shortcut: 'F11' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    children: [
      { id: 'docs', label: 'Documentation' },
      { id: 'shortcuts', label: 'Keyboard Shortcuts' },
      { id: 'about', label: 'About' },
    ],
  },
]

export type TreeNode = {
  id: string
  label: string
  children?: TreeNode[]
}

export const treeData: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'Button.tsx', label: 'Button.tsx' },
          { id: 'Input.tsx', label: 'Input.tsx' },
          { id: 'Modal.tsx', label: 'Modal.tsx' },
        ],
      },
      {
        id: 'pages',
        label: 'pages',
        children: [
          { id: 'Home.tsx', label: 'Home.tsx' },
          { id: 'About.tsx', label: 'About.tsx' },
          { id: 'Contact.tsx', label: 'Contact.tsx' },
        ],
      },
      { id: 'App.tsx', label: 'App.tsx' },
      { id: 'index.tsx', label: 'index.tsx' },
    ],
  },
  {
    id: 'public',
    label: 'public',
    children: [
      { id: 'index.html', label: 'index.html' },
      { id: 'favicon.ico', label: 'favicon.ico' },
    ],
  },
  { id: 'package.json', label: 'package.json' },
  { id: 'README.md', label: 'README.md' },
]

export const autocompleteSuggestions = [
  'Apple',
  'Apricot',
  'Avocado',
  'Banana',
  'Blackberry',
  'Blueberry',
  'Cherry',
  'Coconut',
  'Cranberry',
  'Date',
  'Dragon fruit',
  'Elderberry',
  'Fig',
  'Grape',
  'Grapefruit',
  'Guava',
  'Kiwi',
  'Lemon',
  'Lime',
  'Mango',
  'Melon',
  'Orange',
  'Papaya',
  'Peach',
  'Pear',
  'Pineapple',
  'Plum',
  'Pomegranate',
  'Raspberry',
  'Strawberry',
  'Watermelon',
]
