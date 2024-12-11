import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useNotion } from '../../lib/notion/NotionContext';

interface NotionKey {
  id: string;
  name: string;
  key: string;
}

interface NotionKeysManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotionKeysManager({ isOpen, onOpenChange }: NotionKeysManagerProps) {
  const { notionKeys, saveNotionKeys } = useNotion();
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  const handleAddKey = () => {
    if (!newKeyName || !newKeyValue) return;

    const newKey: NotionKey = {
      id: crypto.randomUUID(),
      name: newKeyName,
      key: newKeyValue,
    };

    saveNotionKeys([...notionKeys, newKey]);
    setNewKeyName('');
    setNewKeyValue('');
  };

  const handleDeleteKey = (id: string) => {
    saveNotionKeys(notionKeys.filter((key) => key.id !== id));
  };

  const handleUpdateKey = (id: string, name: string, key: string) => {
    saveNotionKeys(notionKeys.map((item) => (item.id === id ? { ...item, name, key } : item)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>管理 Notion API Keys</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new key form */}
          <div className="flex gap-2">
            <Input
              placeholder="API Key 名稱"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <Input
              placeholder="API Key"
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              type="password"
            />
            <Button size="icon" onClick={handleAddKey}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* List of existing keys */}
          <div className="space-y-2">
            {notionKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-2">
                <Input
                  value={key.name}
                  onChange={(e) => handleUpdateKey(key.id, e.target.value, key.key)}
                />

                <Button variant="destructive" size="icon" onClick={() => handleDeleteKey(key.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
