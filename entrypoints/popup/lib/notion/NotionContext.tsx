// src/context/NotionContext.tsx

import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { NotionWorkspace, NotionDatabase, NotionPage, ImportSettings } from './notion.d';
import NotionService from './NotionService';

interface NotionContextProps {
  selectedKeyId: string | null;
  setSelectedKeyId: (id: string | null) => void;
  workspace: NotionWorkspace | null;
  setWorkspace: (workspace: NotionWorkspace) => void;
  databases: NotionDatabase[];
  setDatabases: (databases: NotionDatabase[]) => void;
  pages: NotionPage[];
  setPages: (pages: NotionPage[]) => void;
  connectNotion: () => Promise<void>;
  loadDatabases: () => Promise<void>;
  loadPages: (databaseId: string) => Promise<void>;
}

const NotionContext = createContext<NotionContextProps | undefined>(undefined);

export const NotionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [notionService, setNotionService] = useState<NotionService | null>(null);
  const [workspace, setWorkspace] = useState<NotionWorkspace | null>(null);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [pages, setPages] = useState<NotionPage[]>([]);

  useEffect(() => {
    if (selectedKeyId) {
      // 從 storage 中獲取選定的 key
      browser.storage.local.get('notionKeys').then((result) => {
        const keys = JSON.parse(result.notionKeys || '[]');
        const selectedKey = keys.find((k: any) => k.id === selectedKeyId);
        if (selectedKey) {
          setNotionService(new NotionService(selectedKey.key));
        }
      });
    }
  }, [selectedKeyId]);

  const connectNotion = async () => {
    if (!notionService) {
      throw new Error('Please select a Notion API key first');
    }
    const workspaceData = await notionService.verifyApiKey();
    setWorkspace(workspaceData);
  };

  const loadDatabases = async () => {
    if (!notionService || !workspace) {
      throw new Error('Notion client not initialized or workspace not selected');
    }
    const dbs = await notionService.fetchDatabases();
    setDatabases(dbs);
  };

  const loadPages = async (databaseId: string) => {
    if (!notionService) {
      throw new Error('Notion client not initialized');
    }
    const pagesData = await notionService.fetchPages(databaseId);
    setPages(pagesData);
  };

  return (
    <NotionContext.Provider
      value={{
        selectedKeyId,
        setSelectedKeyId,
        workspace,
        setWorkspace,
        databases,
        setDatabases,
        pages,
        setPages,
        connectNotion,
        loadDatabases,
        loadPages,
      }}
    >
      {children}
    </NotionContext.Provider>
  );
};

export const useNotion = (): NotionContextProps => {
  const context = useContext(NotionContext);
  if (!context) {
    throw new Error('useNotion must be used within a NotionProvider');
  }
  return context;
};
