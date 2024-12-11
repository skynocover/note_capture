import { PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { PartialBlock } from '@blocknote/core';

export const notion2BlockNote = (blocks: PartialBlockObjectResponse[]): PartialBlock[] => {
  return blocks.map((block) => {
    // @ts-ignore
    if (block.type === 'paragraph') {
      return {
        id: crypto.randomUUID(),
        type: 'paragraph',
        content: [
          {
            type: 'text',
            // @ts-ignore
            text: block.paragraph.rich_text.map((text: any) => text.plain_text).join(''),
            styles: {},
          },
        ],
      };
    }
    // 可擴展支持其他 Notion 區塊類型
    return {
      id: crypto.randomUUID(),
      type: 'paragraph',
      content: [],
    };
  });
};
