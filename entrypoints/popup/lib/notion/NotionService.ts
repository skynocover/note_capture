// src/services/notionService.ts

import { Client } from '@notionhq/client';
import { NotionWorkspace, NotionDatabase, NotionPage, ImportSettings } from './notion.d';
import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

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
      name: response.name || 'Unnamed Workspace',
    };
  }

  // 獲取資料庫列表
  async fetchDatabases(): Promise<NotionDatabase[]> {
    const { results } = await this.client.search({
      filter: { property: 'object', value: 'database' },
    });

    return results.map((db) => ({
      id: db.id,
      // @ts-ignore
      title: db.properties.title?.title?.[0]?.plain_text || 'Untitled',
    }));
  }

  // 獲取頁面列表
  async fetchPages(databaseId: string): Promise<NotionPage[]> {
    const { results } = await this.client.databases.query({
      database_id: databaseId,
    });

    return [];

    // return results.map((page) => ({
    //   id: page.id,
    //   title: page.properties.title?.title?.[0]?.plain_text || 'Untitled',
    //   created_time: page.created_time,
    //   last_edited_time: page.last_edited_time,
    // }));
  }
}

export default NotionService;
