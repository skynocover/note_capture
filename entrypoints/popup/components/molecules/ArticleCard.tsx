import { useEffect, useState } from 'react';

import { Globe, Trash2, Share } from 'lucide-react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { PartialBlock } from '@blocknote/core';

import { Card, CardContent } from '../ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

import { ImportModal } from '../organisms/ImportModal';

export interface IArticleCard {
  id: string;
  title: string;
  content: string;
  url?: string;
}

export interface IArticleCardProps extends IArticleCard {
  onEdit: (id: string, newContent: string) => void;
  onDelete: () => void;
  onTitleEdit: (id: string, newTitle: string) => void;
  setIsExportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ArticleCard({
  id,
  title,
  content,
  url,
  onEdit,
  onDelete,
  onTitleEdit,
  setIsExportModalOpen,
}: IArticleCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch {
      return url;
    }
  };

  console.log({ content });

  const editor = useCreateBlockNote({
    initialContent: content && content !== '[]' ? JSON.parse(content) : undefined,
  });

  // 監聽編輯器內容變化
  useEffect(() => {
    if (!onEdit) return;

    const handleUpdate = () => {
      const blocks = editor.document;
      onEdit(id, JSON.stringify(blocks));
    };

    editor.onEditorContentChange(handleUpdate);
  }, [editor, id, onEdit]);

  const handleTitleSubmit = () => {
    if (onTitleEdit) {
      onTitleEdit(id, editedTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <Card>
      <CardContent className="p-2">
        <div className="flex gap-6">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                className="text-xl font-bold mb-2 w-full border-b border-gray-300 focus:outline-none focus:border-primary"
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-bold mb-2 cursor-pointer hover:text-gray-700"
                onClick={() => setIsEditingTitle(true)}
              >
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Share className="w-5 h-5 cursor-pointer" onClick={() => setIsExportModalOpen(true)} />

            <AlertDialog>
              <AlertDialogTrigger>
                <Trash2 className="w-5 h-5" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認刪除</AlertDialogTitle>
                  <AlertDialogDescription>
                    確定要刪除這篇文章嗎？此操作無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>確認刪除</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <BlockNoteView editor={editor} className="overflow-hidden" />

        {url && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <Globe className="w-4 h-4" />
            <span>{getDomain(url)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
