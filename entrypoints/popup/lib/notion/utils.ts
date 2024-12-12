import { PartialBlock } from '@blocknote/core';

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

export const notionToBlockNote = (notionBlocks: NotionBlock[]): PartialBlock[] => {
  return notionBlocks.map((block) => {
    const type = mapBlockType(block.type);
    const props = extractProps(block);

    const noteBlock: PartialBlock = {
      id: block.id,
      type,
      props,
      content: block.type === 'quote' ? [] : extractContent(block),
      children: block.type === 'quote' ? extractContent(block) : [],
    };
    return noteBlock;
  });
};

const mapBlockType = (notionType: string): any => {
  const typeMap: Record<string, PartialBlock['type']> = {
    heading_2: 'heading',
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
  //   if (block.type === 'table') {
  //     props.textColor = 'default';
  //   }
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

  return richText.map((textObj: any) => ({
    type: !!textObj.href ? 'link' : textObj.type,
    text: textObj.text?.content || '',
    // block note中的code block不能有styles
    styles: !!block.code?.language ? {} : extractStyles(textObj.annotations || {}),
    href: textObj.href,
    content: !!textObj.href
      ? [
          {
            type: 'text',
            text: textObj.text?.content,
            styles: extractStyles(textObj.annotations || {}),
          },
        ]
      : undefined,
  }));
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
