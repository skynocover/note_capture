import { Card, CardContent } from '../ui/card';
import { Globe, Edit2 } from 'lucide-react';

import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { useEffect } from 'react';

export interface IArticleCard {
  id: string;
  title: string;
  content: string;
  url?: string;
}

export interface IArticleCardProps extends IArticleCard {
  onEdit: (id: string, newContent: string) => void;
}

export function ArticleCard({ id, title, content, url, onEdit }: IArticleCardProps) {
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch {
      return url;
    }
  };

  const editor = useCreateBlockNote({
    initialContent: content ? JSON.parse(content) : undefined,
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

  return (
    <Card>
      <CardContent className="p-2">
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">{title}</h2>
          </div>
        </div>

        <BlockNoteView editor={editor} />

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
