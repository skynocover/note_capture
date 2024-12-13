import React, { createContext, useContext, useEffect, useState } from 'react';

import { IArticleCard } from './components/molecules/ArticleCard';

interface AppContextType {
  articles: IArticleCard[];
  setArticles: React.Dispatch<React.SetStateAction<IArticleCard[]>>;
}

const defaultArticle: IArticleCard = {
  id: '1',
  title: 'Product Manager vs. Product Owner: Key Differences',
  content: `[{"id":"cae5dd43-6d7c-474d-958a-d716742cb9d3","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":2},"content":[{"type":"text","text":"a","styles":{}}],"children":[]},{"id":"ec0a3ca6-b6b5-46af-b99d-eaf0d004c2be","type":"bulletListItem","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"list1","styles":{}}],"children":[]},{"id":"715e9b69-5e03-4c4f-8fca-3e43a8971337","type":"bulletListItem","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"list2","styles":{}}],"children":[]},{"id":"3061da4d-6656-42f7-a6a8-25e0b4e15276","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"226fe594-a5b3-4c80-8e02-e383c7ec7388","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"redwith gray","styles":{"textColor":"red","backgroundColor":"gray"}}],"children":[]},{"id":"f430463d-4d6a-4954-93f7-956cb22753de","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[{"id":"6a3f54d1-b2e3-46d0-a850-45cb3144204d","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"block","styles":{}}],"children":[]}]},{"id":"6de90cdb-264a-429d-ba72-5fe099ddb1e0","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"214e115f-a835-4c2e-b06d-7d26f1f7ca14","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"strike","styles":{"strike":true}}],"children":[]},{"id":"640b761d-bb02-4ca7-8c04-987d67ed0e0d","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"under","styles":{"underline":true}}],"children":[]},{"id":"5d80eafc-a21e-4d3a-9ec8-df8d484465d9","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"215f11b3-fa2a-4a37-8625-6904d58284dc","type":"numberedListItem","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"num1","styles":{}}],"children":[]},{"id":"acf013d0-a22d-4075-90a5-0a69ba9544aa","type":"numberedListItem","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"num2","styles":{}}],"children":[]},{"id":"f96916ea-21c8-4e55-920e-45a56634f7e2","type":"image","props":{"backgroundColor":"default","textAlignment":"left","name":"public","url":"https://imagedelivery.net/BFt8NicDCgLDzBn7OOPidw/2ff393a6-27d1-4971-b0d0-598586394900/public","caption":"","showPreview":true,"previewWidth":512},"children":[]},{"id":"f894cf5e-3af8-4de1-b045-2cf51806b1d7","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"link","href":"https://google.com","content":[{"type":"text","text":"link","styles":{}}]}],"children":[]},{"id":"61065530-7857-4f65-8b88-29a6d0da5334","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"a9e1e578-1628-47cd-bf3a-f9fdffd9c951","type":"checkListItem","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","checked":false},"content":[{"type":"text","text":"check1","styles":{}}],"children":[]},{"id":"bf993a0c-ca8d-4952-8fdf-10e0a4791183","type":"checkListItem","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","checked":false},"content":[{"type":"text","text":"check2","styles":{}}],"children":[]},{"id":"d168545d-baa5-4ba7-bb63-1343fba8fe4c","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"bdf0bd15-1a13-41a4-a34e-b2cb8fe195da","type":"codeBlock","props":{"language":"javascript"},"content":[{"type":"text","text":"code Block","styles":{}}],"children":[]},{"id":"7d91fd56-5813-41cf-a8c3-248eac0ac2ff","type":"table","props":{"textColor":"default"},"content":{"type":"tableContent","columnWidths":[null,null,null],"rows":[{"cells":[[{"type":"text","text":"1","styles":{}}],[],[]]},{"cells":[[],[{"type":"text","text":"2","styles":{}}],[]]},{"cells":[[],[],[{"type":"text","text":"3","styles":{}}]]}]},"children":[]},{"id":"74798441-77fb-474d-b68c-c05c846264b1","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"2aec115d-a152-46ba-ba72-4fce6d7412e5","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]`,
  url: 'https://justanotherpm.com/product-manager-vs-product-owner-key-differences/',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<any> = ({ children }) => {
  const [articles, setArticles] = useState<IArticleCard[]>([defaultArticle]);

  const port = browser.runtime.connect({ name: 'sidebar-connection' });

  useEffect(() => {
    // 進入畫面時 送出事件 不需要disconnect 因為side panel一關掉就自動斷線
    port.postMessage({ action: 'sidePanelOpened' });
  }, []);

  return <AppContext.Provider value={{ articles, setArticles }}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useFSM must be used within a FSMProvider');
  }

  const { articles, setArticles } = context;

  return { articles, setArticles };
};
