import { Card, CardContent } from '../ui/card';
import { MarkdownComponent } from '../atoms/Markdown';
import { Globe } from 'lucide-react';

export interface IArticleCard {
  id: string;
  title: string;
  content: string;
  url?: string;
}

export function ArticleCard({ id, title, content, url }: IArticleCard) {
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch {
      return url;
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-4">{title}</h2>
            </div>
          </div>
          <MarkdownComponent content={content} />
          {url && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <Globe className="w-4 h-4" />
              <span>{getDomain(url)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
