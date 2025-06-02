// Precise data processing functions using exact field mappings from Google Sheets
// Sheet Names: Media Relations, Client Permissions, Media Tracker, Media Tracker (2025), 
// Content, Speaking Opps, Awards, Archive Docs

export interface MediaRelationsItem {
  outlet: string;
  reporter: string;
  dateDeadline: string;
  topic: string;
  status: string;
  type: string;
  id: number;
}

export interface ClientPermissionItem {
  client: string;
  connectionStatus: string;
  notes: string;
  clientLead: string;
  approvalProcess: string;
  mainContact: string;
  reintroduce: string;
  id: number;
}

export interface MediaTrackerItem {
  outlet: string;
  client?: string;
  article: string;
  link: string;
  date: string;
  reporter: string;
  notes: string;
  id: number;
}

export interface MediaTracker2025Item {
  outlet: string;
  type: string;
  client?: string;
  article: string;
  link: string;
  date: string;
  reporter: string;
  notes: string;
  id: number;
}

export interface ContentItem {
  title: string;
  link: string;
  status: string;
  id: number;
}

export interface SpeakingOppsItem {
  event: string;
  speaker: string;
  date: string;
  location: string;
  submission: string;
  id: number;
}

export interface AwardsItem {
  award: string;
  status: string;
  individual: string;
  agency: string;
  category: string;
  dateAnnounced: string;
  submission: string;
  id: number;
}

export interface ArchiveDocsItem {
  title: string;
  link: string;
  type: string;
  id: number;
}

export function processMediaRelations(sheetData: any[]): MediaRelationsItem[] {
  return sheetData.map((item, index) => ({
    outlet: String(item.Outlet || item.A || ''),
    reporter: String(item.Reporter || item.B || ''),
    dateDeadline: String(item['Date / Deadline'] || item.C || ''),
    topic: String(item.Topic || item.D || ''),
    status: String(item.Status || item.E || ''),
    type: String(item.Type || item.F || ''),
    id: index + 1
  }));
}

export function processClientPermissions(sheetData: any[]): ClientPermissionItem[] {
  return sheetData.map((item, index) => ({
    client: String(item.Client || item.A || ''),
    connectionStatus: String(item['Have We Connected with their PR/comms team?'] || item.B || ''),
    notes: String(item['NOTES / UPDATES'] || item.C || ''),
    clientLead: String(item['Client lead'] || item.D || ''),
    approvalProcess: String(item['Approval Process'] || item.E || ''),
    mainContact: String(item['Main point of contact'] || item.F || ''),
    reintroduce: String(item['reintroduce?'] || item.G || ''),
    id: index + 1
  }));
}

export function processMediaTracker(sheetData: any[]): MediaTrackerItem[] {
  return sheetData.map((item, index) => ({
    outlet: String(item.Outlet || item.A || ''),
    client: String(item['Client (if applicable)'] || item.B || ''),
    article: String(item.Article || item.C || ''),
    link: String(item.Link || item.D || ''),
    date: String(item.Date || item.E || ''),
    reporter: String(item.Reporter || item.F || ''),
    notes: String(item.Notes || item.G || ''),
    id: index + 1
  }));
}

export function processMediaTracker2025(sheetData: any[]): MediaTracker2025Item[] {
  return sheetData.map((item, index) => ({
    outlet: String(item.Outlet || item.A || ''),
    type: String(item.Type || item.B || ''),
    client: String(item['Client (if applicable)'] || item.C || ''),
    article: String(item.Article || item.D || ''),
    link: String(item.Link || item.E || ''),
    date: String(item.Date || item.F || ''),
    reporter: String(item.Reporter || item.G || ''),
    notes: String(item.Notes || item.H || ''),
    id: index + 1
  }));
}

export function processContent(sheetData: any[]): ContentItem[] {
  return sheetData.map((item, index) => ({
    title: String(item.Title || item.A || ''),
    link: String(item.Link || item.B || ''),
    status: String(item.Status || item.C || ''),
    id: index + 1
  }));
}

export function processSpeakingOpps(sheetData: any[]): SpeakingOppsItem[] {
  return sheetData.map((item, index) => ({
    event: String(item.Event || item.A || ''),
    speaker: String(item.Speaker || item.B || ''),
    date: String(item.Date || item.C || ''),
    location: String(item.Location || item.D || ''),
    submission: String(item.Submission || item.E || ''),
    id: index + 1
  }));
}

export function processAwards(sheetData: any[]): AwardsItem[] {
  return sheetData.map((item, index) => ({
    award: String(item.Award || item.A || ''),
    status: String(item.Status || item.B || ''),
    individual: String(item.Individual || item.C || ''),
    agency: String(item.Agency || item.D || ''),
    category: String(item.Category || item.E || ''),
    dateAnnounced: String(item['Date Announced'] || item.F || ''),
    submission: String(item.Submission || item.G || ''),
    id: index + 1
  }));
}

export function processArchiveDocs(sheetData: any[]): ArchiveDocsItem[] {
  return sheetData.map((item, index) => ({
    title: String(item.Title || item.A || ''),
    link: String(item.Link || item.B || ''),
    type: String(item.Type || item.C || ''),
    id: index + 1
  }));
}

// Helper function to get data from specific sheet with exact name
export function getSheetData(worksheetData: any, sheetName: string): any[] {
  return worksheetData.sheets[sheetName] || [];
} 