import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';

import { NotionWorkspace, NotionPage, NotionPageContent } from './notion.d';
import NotionService from './NotionService';

interface NotionKey {
  id: string;
  name: string;
  key: string;
}

interface NotionContextProps {
  // loading and error
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;

  selectedKeyId: string | null;
  setSelectedKeyId: (id: string | null) => void;
  workspace: NotionWorkspace | null;
  setWorkspace: (workspace: NotionWorkspace) => void;
  pages: NotionPage[];
  setPages: (pages: NotionPage[]) => void;
  connectNotion: () => Promise<void>;
  loadPages: ({ query, page_size }: { query: string; page_size?: number }) => Promise<void>;
  getPageContent: (pageId: string) => Promise<NotionPageContent>;

  // notion keys 管理
  notionKeys: NotionKey[];
  setNotionKeys: (keys: NotionKey[]) => void;
  saveNotionKeys: (keys: NotionKey[]) => Promise<void>;
}

const NotionContext = createContext<NotionContextProps | undefined>(undefined);

export const NotionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [notionService, setNotionService] = useState<NotionService | null>(null);
  const [workspace, setWorkspace] = useState<NotionWorkspace | null>(null);
  const [pages, setPages] = useState<NotionPage[]>([]);

  // notion keys 管理
  const [notionKeys, setNotionKeys] = useState<NotionKey[]>([]);

  const loadKeys = async () => {
    const result = await browser.storage.local.get('notionKeys');
    if (result.notionKeys) {
      setNotionKeys(JSON.parse(result.notionKeys));
    }
  };

  const saveNotionKeys = async (keys: NotionKey[]) => {
    await browser.storage.local.set({
      notionKeys: JSON.stringify(keys),
    });
    setNotionKeys(keys);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  useEffect(() => {
    if (selectedKeyId) {
      const selectedKey = notionKeys.find((k: any) => k.id === selectedKeyId);
      if (selectedKey) {
        setNotionService(new NotionService(selectedKey.key));
      }
    }
  }, [selectedKeyId]);

  useEffect(() => {
    if (notionService) {
      connectNotion();
      loadPages({ query: '', page_size: 10 });
    }
  }, [notionService]);

  const connectNotion = async () => {
    if (!notionService) {
      throw new Error('Please select a Notion API key first');
    }
    const workspaceData = await notionService.verifyApiKey();
    setWorkspace(workspaceData);
  };

  const loadPages = async ({ query, page_size = 10 }: { query: string; page_size?: number }) => {
    if (!notionService) {
      throw new Error('Notion client not initialized');
    }
    const pagesData = await notionService.fetchPages({ query, page_size });
    setPages(pagesData);
  };

  const getPageContent = async (pageId: string) => {
    if (!notionService) {
      throw new Error('Notion client not initialized');
    }
    const pageContent = await notionService.fetchPageContent(pageId);
    return pageContent;
  };

  return (
    <NotionContext.Provider
      value={{
        loading,
        setLoading,
        error,
        setError,

        selectedKeyId,
        setSelectedKeyId,
        workspace,
        setWorkspace,
        pages,
        setPages,
        connectNotion,
        loadPages,
        getPageContent,
        // notion keys 管理
        notionKeys,
        setNotionKeys,
        saveNotionKeys,
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
