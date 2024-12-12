import { PartialBlock } from '@blocknote/core';
import NotionService from './NotionService';

interface NotionBlock {
  id: string;
  type: string;
  props: Record<string, any>;
  children: NotionBlock[];
  [key: string]: any;
}

export const notionToBlockNote = async ({
  notionBlocks,
  notionService,
}: {
  notionBlocks: NotionBlock[];
  notionService: NotionService | null;
}): Promise<PartialBlock[]> => {
  return Promise.all(
    notionBlocks.map(async (block) => {
      const type = mapBlockType(block.type);
      const props = extractProps(block);

      if (block.type === 'table') {
        if (!notionService) {
          throw new Error('NotionService is not initialized');
        }
        const table = await notionService.fetchPageContent(block.id);
        return convertNotionTableToNoteBlock({ table, block });
      }

      const noteBlock: PartialBlock = {
        id: block.id,
        type,
        props,
        content: block.type === 'quote' ? [] : extractContent(block),
        children: block.type === 'quote' ? extractContent(block) : [],
      };
      return noteBlock;
    }),
  );
};

const mapBlockType = (notionType: string): any => {
  const typeMap: Record<string, PartialBlock['type']> = {
    heading_1: 'heading',
    heading_2: 'heading',
    heading_3: 'heading',
    bulleted_list_item: 'bulletListItem',
    numbered_list_item: 'numberedListItem',
    paragraph: 'paragraph',
    quote: 'paragraph', // Assuming quotes are treated as paragraphs
    to_do: 'checkListItem',
    embed: 'image',
    code: 'codeBlock',
    // table: 'table',
  };
  return typeMap[notionType] || 'paragraph';
};

const extractProps = (block: NotionBlock): Record<string, any> => {
  const props: Record<string, any> = {
    textColor: block[block.type]?.color || 'default',
    backgroundColor: 'default',
    textAlignment: 'left',
  };
  if (block.type === 'to_do') {
    props.checked = block.to_do?.checked || false;
  }
  if (block.type === 'embed') {
    props.url = block.embed?.url || '';
  }
  if (block.type === 'code') {
    props.language = block.code?.language || 'plaintext';
  }
  if (block.type === 'heading_1') {
    props.level = 1;
  }
  if (block.type === 'heading_2') {
    props.level = 2;
  }
  if (block.type === 'heading_3') {
    props.level = 3;
  }
  return props;
};

const extractContent = (block: NotionBlock): any[] => {
  if (block.type === 'table') {
    // Add table processing logic if needed
    return [];
  }

  const richText = block[block.type]?.rich_text || [];

  if (block.type === 'quote') {
    return richText.map((textObj: any) => ({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: textObj.text?.content,
          styles: extractStyles(textObj.annotations || {}),
        },
      ],
    }));
  }

  return richText.map((textObj: any) => convertNotionRichTextToNoteBlock(block, textObj));
};

const extractStyles = (annotations: Record<string, any>): Record<string, any> => {
  return {
    bold: annotations.bold ? true : undefined,
    italic: annotations.italic ? true : undefined,
    underline: annotations.underline ? true : undefined,
    strike: annotations.strikethrough ? true : undefined,
    code: annotations.code ? true : undefined,
    textColor: annotations.color || 'default',
    backgroundColor: annotations.backgroundColor || 'default',
  };
};

/// TABLE

interface NotionRow {
  object: string;
  id: string;
  type: string;
  table_row: {
    cells: Array<
      Array<{
        type: string;
        text: { content: string; link: string | null };
        annotations: Record<string, any>;
        plain_text: string;
        href: string | null;
      }>
    >;
  };
}

const convertNotionTableToNoteBlock = ({
  table,
  block,
}: {
  table: { results: NotionRow[] };
  block: NotionBlock;
}): PartialBlock => {
  const noteBlock: PartialBlock = {
    id: block.id,
    type: 'table',
    props: { textColor: 'default' },
    // @ts-ignore
    content: {
      type: 'tableContent',
      columnWidths: Array(block.table.table_width).fill(null),
      rows: table.results.map((row) => ({
        cells: row.table_row.cells.map((cell) =>
          cell.map((content) => convertNotionRichTextToNoteBlock(block, content)),
        ),
      })),
    },
    children: [],
  };

  return noteBlock;
};

const convertNotionRichTextToNoteBlock = (block: NotionBlock, content: any) => {
  return {
    type: content.href ? 'link' : content.type,
    text: content.text.content || '',
    // block note中的code block不能有styles
    styles: block.code?.language ? {} : extractStyles(content.annotations || {}),
    href: content.href,
    content: !!content.href
      ? [
          {
            type: 'text',
            text: content.text.content,
            styles: extractStyles(content.annotations || {}),
          },
        ]
      : undefined,
  };
};
