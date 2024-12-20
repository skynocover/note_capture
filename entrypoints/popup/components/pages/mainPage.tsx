import { useCallback, useEffect, useState } from 'react';
import { Menu, MoreHorizontal, Share2, ArrowUpRight, Trash2, Table, Camera } from 'lucide-react';
import { PartialBlock } from '@blocknote/core';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArticleCard, IArticleCard, IExportContent } from '../molecules/ArticleCard';
import { useApp } from '../../AppContext';
import { NotionKeysManager } from '../organisms/NotionKeyManager';
import { ImportModal } from '../organisms/ImportModal';

export default function MainPage() {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportContent, setExportContent] = useState<IExportContent>({
    title: '',
    content: '',
  });
  const { articles, setArticles } = useApp();

  // 監聽抓取table的回應
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.action === 'capturedTables' && message.tables) {
        const newArticles: IArticleCard[] = message.tables.map((table: any, index: number) => ({
          id: `table-${Date.now()}-${index}`,
          title: `Captured Table ${index + 1}`,
          content: JSON.stringify([table]),
        }));

        setArticles((prevArticles) => [...prevArticles, ...newArticles]);
      }

      // 新增處理截圖的邏輯
      if (message.action === 'screenshotCaptured' && message.dataUrl) {
        const newArticle: IArticleCard = {
          id: `screenshot-${Date.now()}`,
          title: 'Screenshot',
          content: JSON.stringify([
            {
              id: crypto.randomUUID(),
              type: 'image',
              props: {
                url: message.dataUrl,
                width: message.width || 'auto',
                height: message.height || 'auto',
              },
              children: [],
            },
          ]),
        };

        setArticles((prevArticles) => [...prevArticles, newArticle]);
      }
    };

    browser.runtime.onMessage.addListener(messageListener);
    return () => browser.runtime.onMessage.removeListener(messageListener);
  }, [setArticles]);

  // 送出抓取table的事件
  const handleCaptureTable = useCallback(async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      await browser.tabs.sendMessage(tab.id, {
        action: 'captureTables',
      });
    } catch (error) {
      console.error('Failed to capture tables:', error);
    }
  }, []);

  // Add new blank article
  const handleAddBlankArticle = useCallback(() => {
    const id = crypto.randomUUID();
    const newArticle: IArticleCard = {
      id: `article-${Date.now()}`,
      title: 'New Article',
      content: `[{"id":"${id}","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"f305077d-1cc6-4d62-a766-2f6eb5a1279c","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]`,
    };
    setArticles((prevArticles) => [...prevArticles, newArticle]);
  }, []);

  // Modify onEdit to handle both content and title updates
  const onEdit = (id: string, newContent: string) => {
    setArticles(
      articles.map((article) =>
        article.id === id ? { ...article, content: newContent } : article,
      ),
    );
  };

  const onTitleEdit = (id: string, newTitle: string) => {
    setArticles(
      articles.map((article) => (article.id === id ? { ...article, title: newTitle } : article)),
    );
  };

  // Add delete handler
  const onDelete = (id: string) => {
    setArticles(articles.filter((article) => article.id !== id));
  };

  const handleScreenshot = useCallback(async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      // First capture the visible tab
      const dataUrl = await browser.tabs.captureVisibleTab(browser.windows.WINDOW_ID_CURRENT, {
        format: 'png',
      });

      await browser.tabs.sendMessage(tab.id, {
        action: 'startScreenshotSelection',
        dataUrl: dataUrl,
      });

      console.log({ dataUrl });
    } catch (error) {
      console.error('Failed to start screenshot selection:', error);
    }
  }, []);

  const handleImportConfirm = ({
    title,
    blockNotes,
  }: {
    title: string;
    blockNotes: PartialBlock[];
  }) => {
    const newArticle: IArticleCard = {
      id: `article-${Date.now()}`,
      title,
      content: JSON.stringify(blockNotes),
    };
    setArticles((prevArticles) => [...prevArticles, newArticle]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-4 pb-24 space-y-4">
        {/* Top Navigation */}
        <div className="bg-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Menu className="w-5 h-5" />
            <h1 className="text-gray-400">Untitled Space</h1>
          </div>
          <div className="flex items-center gap-4">
            <Share2 className="w-5 h-5" />
            <Button variant="ghost" size="icon" onClick={() => setIsKeyModalOpen(true)}>
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            {...article}
            onEdit={onEdit}
            onDelete={() => onDelete(article.id)}
            onTitleEdit={onTitleEdit}
            setIsExportModalOpen={setIsExportModalOpen}
            setExportContent={setExportContent}
          />
        ))}

        {/* Database Comparison Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl mb-4">比較資料庫</h2>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-between">
                不同資料庫的性比較
                <ArrowUpRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                資料庫選擇的關鍵因素
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modified Chat Input section */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleAddBlankArticle}>
              <span className="text-2xl">+</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCaptureTable} title="Capture Table">
              <Table className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleScreenshot} title="Screenshot">
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsImportModalOpen(true)}
              title="Import from Notion"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Chat about this page"
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-400"
              />
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-lg" />
          </div>
        </div>
        <NotionKeysManager isOpen={isKeyModalOpen} onOpenChange={setIsKeyModalOpen} />
        <ImportModal
          isImportOpen={isImportModalOpen}
          isExportOpen={isExportModalOpen}
          exportContent={exportContent}
          onImport={handleImportConfirm}
          onClose={() => {
            setIsImportModalOpen(false);
            setIsExportModalOpen(false);
          }}
        />
      </main>
    </div>
  );
}
