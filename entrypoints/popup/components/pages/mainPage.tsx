import { Bell, Menu, MoreHorizontal, Share2, Globe, ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export default function MainPage() {
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

        {/* Article Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">
                  Product Manager vs. Product Owner: Key Differences
                </h2>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <span className="w-4 h-4 bg-gray-200 rounded" />
                  <span>Product Manager vs. Product Owner...</span>
                  <span>justanotherpm.com</span>
                  <span>Fetched 1d ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Easy Scraper Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Easy Scraper</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Globe className="w-4 h-4" />
                  <span>easyscraper.com</span>
                  <span className="text-red-500">Could not load URL</span>
                </div>
              </div>
              <Globe className="w-12 h-12 text-gray-200" />
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
