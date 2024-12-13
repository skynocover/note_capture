import React, { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { PartialBlock } from '@blocknote/core';

import { useNotion } from '../../lib/notion/NotionContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useDebounce } from '../../hooks/useDebounce';
import { NotionPage } from '../../lib/notion/notion.d';
import { notionToBlockNote, blockNoteToNotion } from '../../lib/notion/utils';
import { IExportContent } from '../molecules/ArticleCard';

interface ImportModalProps {
  isImportOpen: boolean;
  isExportOpen: boolean;
  onClose: () => void;
  onImport: ({ title, blockNotes }: { title: string; blockNotes: PartialBlock[] }) => void;
  exportContent: IExportContent;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isImportOpen,
  isExportOpen,
  onClose,
  onImport,
  exportContent,
}) => {
  const mode = isImportOpen ? 'import' : 'export';
  const isOpen = isImportOpen || isExportOpen;

  const {
    loading,
    setLoading,
    error,
    setError,
    selectedKeyId,
    setSelectedKeyId,
    workspace,
    pages,
    loadPages,
    notionKeys,
    getPageContent,
    notionService,
  } = useNotion();

  const [selectedPage, setSelectedPage] = useState<string>('');
  const [recentPages, setRecentPages] = useState<NotionPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // 修改 recentPages 的狀態管理，根據模式分別存取
  useEffect(() => {
    const storageKey = mode === 'import' ? 'recentImportPages' : 'recentExportPages';
    browser.storage.local.get(storageKey).then((result) => {
      const saved = JSON.parse(result[storageKey] || '[]');
      setRecentPages(saved);
    });
  }, [mode]);

  useEffect(() => {
    if (selectedKeyId) {
      handleKeySelect(selectedKeyId);
    }
  }, [selectedKeyId]);

  // Add effect for debounced search
  useEffect(() => {
    if (selectedKeyId) {
      loadPages({ query: debouncedQuery, page_size: 6 });
    }
  }, [debouncedQuery, selectedKeyId]);

  // 確認選擇
  const handleConfirm = async () => {
    if (!selectedPage) {
      setError('Please select a page');
      return;
    }

    setLoading(true);
    try {
      const selectedPageData =
        pages.find((p) => p.id === selectedPage) || recentPages.find((p) => p.id === selectedPage);

      if (selectedPageData) {
        const storageKey = mode === 'import' ? 'recentImportPages' : 'recentExportPages';
        const updatedRecentPages = [
          selectedPageData,
          ...recentPages.filter((p) => p.id !== selectedPage),
        ].slice(0, 3);

        setRecentPages(updatedRecentPages);
        await browser.storage.local.set({
          [storageKey]: JSON.stringify(updatedRecentPages),
        });
      }

      if (mode === 'import') {
        const pageContent = await getPageContent(selectedPage);
        const blocks = await notionToBlockNote({
          notionBlocks: pageContent.results,
          notionService,
        });
        onImport({ title: pageContent.title, blockNotes: blocks });
      } else {
        await notionService?.createPage({
          parentPageId: selectedPage,
          title: exportContent.title,
          content: blockNoteToNotion(JSON.parse(exportContent.content)),
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
      setError('Failed to fetch page content');
    } finally {
      setLoading(false);
    }
  };

  const handleKeySelect = async (keyId: string) => {
    setSelectedKeyId(keyId);
  };

  // Add refresh handler
  const handleRefresh = async () => {
    await loadPages({ query: debouncedQuery, page_size: 6 });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'import' ? 'Import from Notion' : 'Export to Notion'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4 min-w-[320px]">
            {/* API Key Selection with Refresh Button */}
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium">Select API Key</label>
              <div className="flex gap-2 w-full">
                <Select
                  value={selectedKeyId || ''}
                  onValueChange={handleKeySelect}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a key..." />
                  </SelectTrigger>
                  <SelectContent>
                    {notionKeys.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={!selectedKeyId || loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {workspace && (
              <>
                {/* Search Input */}
                <div className="space-y-2 w-full max-w-full">
                  <label className="text-sm font-medium">Search {workspace.name} Pages</label>
                  <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-full max-w-full"
                    />
                  </div>
                </div>

                {/* Recent Databases Grid */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium">Recent Pages</label>
                  <div className="flex flex-col gap-2 w-full">
                    {recentPages.map((page) => (
                      <Button
                        key={page.id}
                        variant={selectedPage === page.id ? 'default' : 'outline'}
                        className="w-full justify-start text-left h-auto py-2 px-3 truncate max-w-full"
                        onClick={() => setSelectedPage(page.id)}
                      >
                        {page.title}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Modified Root Pages Grid */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium">Pages</label>
                  <div className="flex flex-col gap-2 w-full">
                    {pages.map((page) => (
                      <Button
                        key={page.id}
                        variant={selectedPage === page.id ? 'default' : 'outline'}
                        className="w-full justify-start text-left h-auto py-2 px-3 truncate max-w-full"
                        onClick={() => setSelectedPage(page.id)}
                      >
                        {page.title}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !selectedPage}>
            {loading ? 'Loading...' : mode === 'import' ? 'Import' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
