// ImportModal.tsx
import React, { useEffect, useState } from 'react';
import { useNotion } from '../../lib/notion/NotionContext';
import { ImportSettings } from '../../lib/notion/notion.d';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: ImportSettings) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const {
    selectedKeyId,
    setSelectedKeyId,
    workspace,
    databases,
    pages,
    connectNotion,
    loadDatabases,
    loadPages,
  } = useNotion();

  const [keys, setKeys] = useState<Array<{ id: string; name: string; key: string }>>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 載入儲存的 API Keys
  useEffect(() => {
    browser.storage.local.get('notionKeys').then((result) => {
      const savedKeys = JSON.parse(result.notionKeys || '[]');
      setKeys(savedKeys);
    });
  }, []);

  useEffect(() => {
    if (selectedKeyId) {
      handleKeySelect(selectedKeyId);
    }
  }, [selectedKeyId]);

  // 當選擇 API Key 時
  const handleKeySelect = async (keyId: string) => {
    try {
      setLoading(true);
      setError('');
      setSelectedKeyId(keyId);
      await connectNotion();
      await loadDatabases();
    } catch (err) {
      setError('Failed to connect to Notion');
    } finally {
      setLoading(false);
    }
  };

  // 當選擇資料庫時
  const handleDatabaseSelect = async (databaseId: string) => {
    try {
      setLoading(true);
      setError('');
      setSelectedDatabase(databaseId);
      await loadPages(databaseId);
    } catch (err) {
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  // 確認選擇
  const handleConfirm = () => {
    if (!selectedPage) {
      setError('Please select a page');
      return;
    }

    const settings: ImportSettings = {
      databaseId: selectedDatabase,
      selectedNotes: [selectedPage],
    };
    onConfirm(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Import from Notion</h2>

        {/* API Key 選擇 */}
        <div className="mb-4">
          <label className="block mb-2">Select API Key</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedKeyId || ''}
            onChange={(e) => handleKeySelect(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a key...</option>
            {keys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.name}
              </option>
            ))}
          </select>
        </div>

        {/* 資料庫選擇 */}
        {workspace && (
          <div className="mb-4">
            <label className="block mb-2">Select Database</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedDatabase}
              onChange={(e) => handleDatabaseSelect(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a database...</option>
              {databases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 頁面選擇 */}
        {selectedDatabase && (
          <div className="mb-4">
            <label className="block mb-2">Select Page</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a page...</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* 按鈕 */}
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleConfirm}
            disabled={loading || !selectedPage}
          >
            {loading ? 'Loading...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
