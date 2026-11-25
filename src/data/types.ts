export type UnitNumber = 1 | 2 | 3;

export type Unit = {
  n: UnitNumber;
  name: string;
  marks: number;
  color: string;
};

export type Topic = {
  id: string;
  unit: UnitNumber;
  title: string;
  marks: 2 | 5 | 10;
  marksLabel?: string;
  def: string;
  answer: string[];
  trickId?: string;
  templateId?: string;
  extraTemplateIds?: string[];
};

export type Trick = {
  id: string;
  unit: UnitNumber;
  title: string;
  mnemonic: string;
  expansion: [string, string][];
  story: string;
  hook: string;
  cast?: [string, string][];
  trap?: string;
  diagramId?: string;
};

export type FlowchartNode = {
  id: string;
  shape: 'oval' | 'rectangle' | 'diamond' | 'parallelogram';
  label: string;
  x: number;
  y: number;
};

export type FlowchartEdge = {
  from: string;
  to: string;
  label?: string;
  points?: string;
};

export type FlowchartVariant = {
  id: 'if' | 'if-else' | 'ladder' | 'switch';
  label: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  syntax: string;
  outline: string;
};

export type Template = {
  id: string;
  unit: UnitNumber;
  title: string;
  marks: number;
  marksLabel?: string;
  qRef?: string;
  code: string;
  output: string;
  sampleInput?: string;
  notes?: string;
  answerOutline?: string;
  isDiagramOnly?: boolean;
  flowchartVariants?: FlowchartVariant[];
};

export type Pyq = {
  id: string;
  exam: string;
  q: string;
  text: string;
  marks: number;
  unit: UnitNumber;
  templateId?: string;
  unofficial?: boolean;
  outline?: string;
  answerPoints?: string[];
  answerCode?: string;
  answerOutput?: string;
  seenBadge?: string;
};

export type Block = {
  id: string;
  start: string;
  end: string;
  title: string;
  task: string;
  route?: string;
};

export type Card = {
  id: string;
  front: string;
  back: string;
  unit: UnitNumber;
  source: 'cast' | 'twomark';
  role?: string;
  trickTitle?: string;
};

export type QuickAction = {
  label: string;
  route: string;
};

export type MarkCardConfig = {
  id: string;
  title: string;
  subtitle: string;
  unit: UnitNumber;
  templateId: string;
  altTemplateId?: string;
  altLabel?: string;
};
