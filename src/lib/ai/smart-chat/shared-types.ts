interface HideCondition {
  key: string;
  value: any;
  operator: "eq";
}

interface GenericFormEntryBase {
  label: string;
  key: string;
  required?: boolean;
  tooltip?: string;
  validation?: any; // a valibot validation object
  disabled?: boolean;
  info?: string;
  hide?: HideCondition[];
  headerBold?: boolean;
  visible?: boolean;
}

interface NumberFormEntry extends GenericFormEntryBase {
  type: "number";
  settings?: {
    width?: string;
    min?: number;
    max?: number;
    thousandSeparator?: boolean;
    suffix?: string;
    bold?: boolean;
  };
}

interface TextFormEntry extends GenericFormEntryBase {
  type: "text" | "password" | "email";
  settings?: {
    width?: string;
    placeholder?: string;
    bold?: boolean;
  };
}

interface DateFormEntry extends GenericFormEntryBase {
  type: "date";
}

interface ColorFormEntry extends GenericFormEntryBase {
  type: "color";
}

interface TimeFormEntry extends GenericFormEntryBase {
  type: "time";
}

interface DateTimeFormEntry extends GenericFormEntryBase {
  type: "datetime";
}

interface TextAreaFormEntry extends GenericFormEntryBase {
  type: "textarea";
  settings?: {
    showReWrite?: boolean;
  };
}

interface SelectFormEntry extends GenericFormEntryBase {
  type: "select";
  display?: "dropdown" | "button";
  options: any[];
  optionsKey?: string;
  optionsLabel?: string;
  optionsType?: "string" | "object" | "icon-object" | "color-object"; // the type of the options
  optionsIcon?: string; // the key to address the icon class in the options object
  settings?: {
    placeholder?: string;
  };
}

interface MultiSelectFormEntry extends GenericFormEntryBase {
  type: "multi-select";
  options: any[];
  optionsKey?: string;
  optionsLabel?: string;
  optionsType?: "string" | "object" | "icon-object" | "color-object"; // the type of the options
  optionsIcon?: string; // the key to address the icon class in the options object
  settings?: {
    placeholder?: string;
  };
}

interface RadioFormEntry extends GenericFormEntryBase {
  type: "radio";
  options: any[];
  optionsKey?: string;
  optionsLabel?: string;
}

interface CheckboxFormEntry extends GenericFormEntryBase {
  type: "checkbox";
}

interface SliderFormEntry extends GenericFormEntryBase {
  type: "slider";
  settings?: {
    min?: number;
    max?: number;
    step?: number;
  };
}

// Layouts
interface SpacerFormEntry extends GenericFormEntryBase {
  type: "spacer";
}

interface HorizontalLineEntry extends GenericFormBaseLayout {
  type: "horizontal-line";
  settings?: {
    thickness?: number;
    color?: string;
  };
}

interface GenericFormBaseLayout {
  hide?: HideCondition[];
  visible?: boolean;
}

// Simple Header
interface SectionHeader extends GenericFormBaseLayout {
  type: "section-header";
  header: string;
}

// Simple 2-cols 50% layout
interface TwoColLayout extends GenericFormBaseLayout {
  type: "two-col-layout";
  childs: FormEntry[]; // no other layout can be inside this layout
}

// Flexible 2-cols layout. One of the columns will grow to fill the space
interface TwoColFlexibleLayout extends GenericFormBaseLayout {
  type: "two-col-flexible-layout";
  grow: "left" | "right";
  childs: FormEntry[]; // no other layout can be inside this layout
}

// A list of components in one row. growing can be defined
interface FlexRowLayout extends GenericFormBaseLayout {
  type: "flexible-row-layout";
  grow: {
    [i: number]: boolean;
  };
  childs: FormEntry[]; // no other layout can be inside this layout
}

interface TwoColLabelValueEntry extends GenericFormBaseLayout {
  type: "two-col-label-value";
  child: FormEntry; // no other layout can be inside this layout
}

// Actions
interface ButtonEntry {
  type: "button";
  label: string;
  icon?: string;
  settings?: {
    width?: string;
  };
  hide?: HideCondition[];
  visible?: boolean;
  action: () => void;
}

export type FormEntry =
  | NumberFormEntry
  | TextFormEntry
  | DateFormEntry
  | TimeFormEntry
  | DateTimeFormEntry
  | TextAreaFormEntry
  | SelectFormEntry
  | MultiSelectFormEntry
  | CheckboxFormEntry
  | RadioFormEntry
  | SliderFormEntry
  | ColorFormEntry;

export type LayoutEntry =
  | TwoColLayout
  | TwoColLabelValueEntry
  | TwoColFlexibleLayout
  | FlexRowLayout
  | SectionHeader
  | SpacerFormEntry
  | HorizontalLineEntry;

export type GenericFormAction = ButtonEntry;

// Union type of all form entries
export type GenericFormEntry = FormEntry | LayoutEntry | GenericFormAction;

export interface ServerChatItemBase {
  chatId: string;
  role: "user" | "system" | "assistant";
  content: string;
}

export interface ServerChatItemText extends ServerChatItemBase {
  renderType: "text";
}

export interface ServerChatItemBox extends ServerChatItemBase {
  renderType: "box";
  type: "info" | "warning" | "error";
}

export interface ServerChatItemForm extends ServerChatItemBase {
  renderType: "form";
  definition: GenericFormEntry[];
  data: { [key: string]: any };
}

export interface ServerChatItemMarkdown extends ServerChatItemBase {
  renderType: "markdown";
}

export type ServerChatItem =
  | ServerChatItemText
  | ServerChatItemForm
  | ServerChatItemBox
  | ServerChatItemMarkdown;
