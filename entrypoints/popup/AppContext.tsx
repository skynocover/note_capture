import React, { createContext, useContext, useEffect, useState } from 'react';

import { IArticleCard, ArticleCard } from './components/molecules/ArticleCard';

interface AppContextType {
  articles: IArticleCard[];
  setArticles: (articles: IArticleCard[]) => void;
}

const defaultArticle: IArticleCard = {
  id: '1',
  title: 'Product Manager vs. Product Owner: Key Differences',
  content: `## Product Manager vs. Product Owner: Key Differences
123

### 456

- 123
- 456
    `,
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
