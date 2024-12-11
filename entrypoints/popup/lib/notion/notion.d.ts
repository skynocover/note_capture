// src/types/notion.d.ts

export interface NotionWorkspace {
  id: string;
  name: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
}

export interface NotionPage {
  id: string;
  title: string;
  created_time: string;
  last_edited_time: string;
}

export interface NotionPageContent {
  title: string;
  results: PartialBlockObjectResponse[];
}
