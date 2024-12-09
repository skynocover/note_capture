import React, { createContext, useContext, useEffect, useState } from 'react';

import { IArticleCard } from './components/molecules/ArticleCard';

interface AppContextType {
  articles: IArticleCard[];
  setArticles: React.Dispatch<React.SetStateAction<IArticleCard[]>>;
}

const defaultArticle: IArticleCard = {
  id: '1',
  title: 'Product Manager vs. Product Owner: Key Differences',
  content: `[{"id":"5e9a1bd1-73d1-4551-94b9-dfa653c2acde","type":"heading","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left","level":2},"content":[{"type":"text","text":"123","styles":{}}],"children":[]},{"id":"f978fae2-9bbd-4d77-bd7d-00ca10653cd6","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"1566","styles":{}}],"children":[]},{"id":"5d936add-2d0f-4575-8c31-33fc4b0d0924","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"52597844-7601-48de-82f6-3c73ba87b97b","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"asfe","styles":{}}],"children":[]},{"id":"09124054-ad85-4ba7-97e0-e700c2102f6f","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"a","styles":{}}],"children":[]},{"id":"f305077d-1cc6-4d62-a766-2f6eb5a1279c","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]`,
  url: 'https://justanotherpm.com/product-manager-vs-product-owner-key-differences/',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<any> = ({ children }) => {
  const [articles, setArticles] = useState<IArticleCard[]>([defaultArticle]);

  useEffect(() => {}, []);

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
