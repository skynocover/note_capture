import { PartialBlock } from '@blocknote/core';
import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';
import NotionService from './NotionService';

// 明確的類型定義
export interface INotionBlock {
  id: string;
  type: string;
  props: Record<string, any>;
  children: INotionBlock[];
  table?: {
    table_width: number;
  };
  [key: string]: any;
}

interface NotionRichText {
  type: string;
  text: {
    content: string;
    link: string | null;
  };
  annotations: Record<string, boolean>;
  href: string | null;
}

interface NotionTableRow {
  table_row: {
    cells: Array<NotionRichText[]>;
  };
}

// 常量配置
const BLOCK_TYPE_MAP: Record<string, PartialBlock['type']> = {
  heading_1: 'heading',
  heading_2: 'heading',
  heading_3: 'heading',
  bulleted_list_item: 'bulletListItem',
  numbered_list_item: 'numberedListItem',
  paragraph: 'paragraph',
  quote: 'paragraph',
  to_do: 'checkListItem',
  embed: 'image',
  code: 'codeBlock',
  table: 'table',
} as const;

// 新增一個反向的類型映射
const REVERSE_BLOCK_TYPE_MAP: Record<string, string> = Object.entries(BLOCK_TYPE_MAP).reduce(
  (acc, [notionType, blockNoteType]) => ({
    ...acc,
    [blockNoteType as string]: notionType,
  }),
  {},
);

// 主要轉換函數
export const notionToBlockNote = async ({
  notionBlocks,
  notionService,
}: {
  notionBlocks: INotionBlock[];
  notionService: NotionService | null;
}): Promise<PartialBlock[]> => {
  try {
    return await Promise.all(
      notionBlocks.map(async (block) => {
        const type = BLOCK_TYPE_MAP[block.type] || 'paragraph';
        const props = extractProps(block);

        const content = await getBlockContent(block, notionService);

        return {
          id: block.id,
          type,
          props,
          content: block.type === 'quote' ? [] : content,
          children: block.type === 'quote' ? content : [],
        };
      }),
    );
  } catch (error) {
    console.error('Error converting Notion blocks:', error);
    throw error;
  }
};

// 提取屬性
const extractProps = (block: INotionBlock): Record<string, any> => {
  const baseProps = {
    textColor: block[block.type]?.color || 'default',
    backgroundColor: 'default',
    textAlignment: 'left',
  };

  const specificProps: Record<string, any> =
    {
      to_do: { checked: block.to_do?.checked || false },
      embed: { url: block.embed?.url || '' },
      code: { language: block.code?.language || 'plaintext' },
      heading_1: { level: 1 },
      heading_2: { level: 2 },
      heading_3: { level: 3 },
    }[block.type] || {};

  return { ...baseProps, ...specificProps };
};

// 獲取區塊內容
const getBlockContent = async (
  block: INotionBlock,
  notionService: NotionService | null,
): Promise<any> => {
  // table要另外處理
  if (block.type === 'table') {
    if (!notionService) {
      throw new Error('NotionService is required for table blocks');
    }
    const table = await notionService.fetchPageContent(block.id);
    return convertNotionTableToNoteBlock(table, block);
  }

  const richText: NotionRichText[] = block[block.type]?.rich_text || [];

  if (block.type === 'quote') {
    return richText.map(createQuoteContent);
  }

  return richText.map((textObj) => convertNotionRichTextToNoteBlock(block, textObj));
};

// 創建引用內容
const createQuoteContent = (textObj: NotionRichText) => ({
  type: 'paragraph',
  content: [
    {
      type: 'text',
      text: textObj.text?.content,
      styles: extractStyles(textObj.annotations || {}),
    },
  ],
});

// 提取樣式
const extractStyles = (annotations: Record<string, boolean>) => ({
  bold: annotations.bold || undefined,
  italic: annotations.italic || undefined,
  underline: annotations.underline || undefined,
  strike: annotations.strikethrough || undefined,
  code: annotations.code || undefined,
  textColor: annotations.color || 'default',
  backgroundColor: annotations.backgroundColor || 'default',
});

// 轉換表格
const convertNotionTableToNoteBlock = (
  table: { results: NotionTableRow[] },
  block: INotionBlock,
) => ({
  type: 'tableContent',
  columnWidths: Array(block.table?.table_width || 0).fill(null),
  rows: table.results.map((row) => ({
    cells: row.table_row.cells.map((cell) =>
      cell.map((content) => convertNotionRichTextToNoteBlock(block, content)),
    ),
  })),
});

// 轉換富文本
const convertNotionRichTextToNoteBlock = (block: INotionBlock, content: NotionRichText) => ({
  type: content.href ? 'link' : content.type,
  text: content.text.content || '',
  styles: block.type === 'code' ? {} : extractStyles(content.annotations || {}),
  href: content.href,
  content: content.href
    ? [
        {
          type: 'text',
          text: content.text.content,
          styles: extractStyles(content.annotations || {}),
        },
      ]
    : undefined,
});

export const blockNoteToNotion = (blocks: PartialBlock[]): BlockObjectRequest[] => {
  return blocks.map((block) => {
    const notionType = REVERSE_BLOCK_TYPE_MAP[block.type || 'paragraph'] || 'paragraph';

    if (block.type === 'image') {
      return {
        object: 'block',
        type: 'embed',
        embed: {
          url: block.props?.url || '',
        },
      } as BlockObjectRequest;
    }

    if (block.type === 'codeBlock') {
      return {
        object: 'block',
        type: 'code',
        code: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content?.[0]?.text || '',
                link: null,
              },
            },
          ],
          language: block.props?.language || 'plaintext',
        },
      } as BlockObjectRequest;
    }

    if (block.type === 'table') {
      return {
        object: 'block',
        type: 'table',
        table: {
          table_width: block.content?.columnWidths?.length || 1,
          has_column_header: false,
          has_row_header: false,
          children:
            block.content?.rows?.map((row) => ({
              type: 'table_row',
              table_row: {
                cells: row.cells.map((cell) =>
                  cell.map((content) => ({
                    type: 'text',
                    text: { content: content.text || '', link: null },
                  })),
                ),
              },
            })) || [],
        },
      } as BlockObjectRequest;
    }

    return {
      object: 'block',
      type: notionType,
      [notionType]: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: block.content?.[0]?.text || '',
              link: null,
            },
          },
        ],
      },
    } as BlockObjectRequest;
  });
};
