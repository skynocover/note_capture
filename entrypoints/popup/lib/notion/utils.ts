import { PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { PartialBlock } from '@blocknote/core';

export const notion2BlockNote = (blocks: PartialBlockObjectResponse[]): PartialBlock[] => {
  const blockNoteBlocks: PartialBlock[] = [];

  blocks.forEach((block) => {
    // @ts-expect-error
    const blockType = block.type;
    let blockNoteBlock: PartialBlock | null = null;

    switch (blockType) {
      case 'paragraph':
        blockNoteBlock = {
          type: 'paragraph',
          content: parseRichText(block.paragraph.rich_text),
          children: [],
        };
        break;
      case 'heading_1':
        blockNoteBlock = {
          type: 'heading',
          content: parseRichText(block.heading_1.rich_text),
        };
        break;
      case 'heading_2':
        blockNoteBlock = {
          type: 'heading',
          props: { level: 2 },
          content: parseRichText(block.heading_2.rich_text),
        };
        break;
      case 'heading_3':
        blockNoteBlock = {
          type: 'heading',
          props: { level: 3 },
          content: parseRichText(block.heading_3.rich_text),
        };
        break;
      case 'bulleted_list_item':
        blockNoteBlock = {
          type: 'bulletListItem',
          content: parseRichText(block.bulleted_list_item.rich_text),
        };
        break;
      case 'numbered_list_item':
        blockNoteBlock = {
          type: 'numberedListItem',
          content: parseRichText(block.numbered_list_item.rich_text),
        };
        break;
      case 'to_do':
        blockNoteBlock = {
          type: 'checkListItem',
          content: parseRichText(block.to_do.rich_text),
          props: { checked: block.to_do.checked },
        };
        break;
      case 'toggle':
        blockNoteBlock = {
          type: 'paragraph',
          content: parseRichText(block.toggle.rich_text),
          children: block.has_children ? [] : undefined, // 可根據需要處理子區塊
        };
        break;
      case 'quote':
        blockNoteBlock = {
          type: 'paragraph',
          content: parseRichText(block.quote.rich_text),
        };
        break;
      case 'code':
        blockNoteBlock = {
          type: 'codeBlock',
          props: { language: block.code.language },
          content: block.code.rich_text.map((rt: any) => rt.text.content).join('\n'),
        };
        break;
      case 'divider':
        // blockNoteBlock = { type: 'divider' };
        break;
      case 'callout':
        blockNoteBlock = {
          type: 'paragraph',
          content: parseRichText(block.callout.rich_text),
          props: { icon: block.callout.icon, color: block.callout.color },
        };
        break;
      case 'child_page':
        blockNoteBlock = {
          type: 'paragraph',
          content: block.child_page.title,
        };
        break;
      case 'table':
        // TODO: table要另外處理
        // console.log(block);
        // blockNoteBlock = {
        //   type: 'table',
        //   content: {
        //     type: 'tableContent',
        //     rows: block.table.table_rows.map((row: any) => ({
        //       cells: row.table_cells.map((cell: any) => cell.content),
        //     })),
        //   },
        // };
        break;
      default:
        console.warn(`未處理的 Notion block 類型: ${blockType}`);
        break;
    }

    if (blockNoteBlock) {
      blockNoteBlocks.push(blockNoteBlock);
    }
  });

  //   return [blockNoteBlocks[0]];
  return blockNoteBlocks;
};

interface NotionRichText {
  type: string;
  text: {
    content: string;
    link: string | null;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href: string | null;
}

interface InlineContent {
  type: 'text' | 'link';
  text: string;
  href?: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    textColor?: string;
    backgroundColor?: string;
  };
}

// 解析 Notion 的富文本為 blockNote 的內聯內容
function parseRichText(richTexts: NotionRichText[]): InlineContent[] {
  const inlineContents: InlineContent[] = [];

  richTexts.forEach((rt) => {
    if (rt.type === 'text') {
      const styles: any = {};
      if (rt.annotations.bold) styles.bold = true;
      if (rt.annotations.italic) styles.italic = true;
      if (rt.annotations.color && rt.annotations.color !== 'default') {
        styles.textColor = rt.annotations.color;
      }
      // Notion 的 color 包含文字顏色和背景色，需根據具體需求解析
      // 這裡簡單處理為文字顏色
      inlineContents.push({
        type: 'text',
        text: rt.text.content,
        href: rt.text.link ? rt.text.link : undefined,
        styles,
      });
    }
    // 可以處理更多類型的富文本，如 mentions, equations 等
  });

  return inlineContents;
}
