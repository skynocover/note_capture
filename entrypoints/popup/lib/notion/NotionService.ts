import { Client } from '@notionhq/client';
import { NotionPageContent, NotionWorkspace, NotionPage } from './notion.d';

class NotionService {
  private client: Client;

  constructor(apiKey: string) {
    this.client = new Client({ auth: apiKey });
  }

  // 驗證 API Key 並獲取用戶資訊
  async verifyApiKey(): Promise<NotionWorkspace> {
    const response = await this.client.users.me({});

    return {
      id: response.id,
      // @ts-ignore
      name: response.bot.workspace_name || 'Unnamed Workspace',
    };
  }

  // 獲取資料庫列表
  async fetchPages({
    query,
    page_size = 10,
  }: {
    query: string;
    page_size?: number;
  }): Promise<NotionPage[]> {
    const { results } = await this.client.search({
      query,
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
      page_size,
    });

    // console.table(results);

    return results.map((db) => {
      // @ts-ignore
      const { id, created_time, last_edited_time, properties, title } = db;

      return {
        id,
        title:
          title?.[0]?.plain_text ||
          properties.title?.title?.[0]?.plain_text ||
          properties.Name?.title?.[0]?.plain_text ||
          'Untitled',
        created_time,
        last_edited_time,
      };
    });
  }

  async fetchPageContent(pageId: string): Promise<NotionPageContent> {
    const { results } = await this.client.blocks.children.list({ block_id: pageId });
    const page = await this.client.blocks.retrieve({ block_id: pageId });
    // @ts-ignore
    const title = page.child_page ? page.child_page.title : page.child_database?.title;

    return { title, results };
  }
}

export default NotionService;
