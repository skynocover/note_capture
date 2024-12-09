import { Menu, MoreHorizontal, Share2, ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArticleCard } from '../molecules/ArticleCard';
import { useApp } from '../../AppContext';

export default function MainPage() {
  const { articles } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Top Navigation */}
        <div className="bg-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Menu className="w-5 h-5" />
            <h1 className="text-gray-400">Untitled Space</h1>
          </div>
          <div className="flex items-center gap-4">
            <Share2 className="w-5 h-5" />
            <MoreHorizontal className="w-5 h-5" />
          </div>
        </div>

        {articles.map((article) => (
          <ArticleCard key={article.id} {...article} />
        ))}

        {/* Database Comparison Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl mb-4">比較資料庫</h2>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-between">
                不同資料庫的特性比較
                <ArrowUpRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                資料庫選擇的關鍵因素
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Input */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <span className="text-2xl">+</span>
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
      </main>
    </div>
  );
}
