// Command Palette Models

export type CommandCategory = 'navigation' | 'actions' | 'settings' | 'help' | 'recent';

export interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category: CommandCategory;
  keywords?: string[]; // Additional search terms
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
}

export interface CommandGroup {
  category: CommandCategory;
  label: string;
  commands: Command[];
}

export const COMMAND_CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigation: 'commands.categories.navigation',
  actions: 'commands.categories.actions',
  settings: 'commands.categories.settings',
  help: 'commands.categories.help',
  recent: 'commands.categories.recent'
};

export const COMMAND_CATEGORY_ICONS: Record<CommandCategory, string> = {
  navigation: '🧭',
  actions: '⚡',
  settings: '⚙️',
  help: '❓',
  recent: '🕐'
};
