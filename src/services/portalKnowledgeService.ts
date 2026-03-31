import { KNOWLEDGE_BASE_ARTICLES, KnowledgeArticle } from '@/constants/knowledgeBase';

export const portalKnowledgeService = {
  /**
   * Fetches articles from the knowledge base.
   * Currently returns from constants as no DB table exists in smartstay schema yet.
   */
  getArticles: async (filters?: { category?: string; search?: string }): Promise<KnowledgeArticle[]> => {
    return KNOWLEDGE_BASE_ARTICLES.filter((a) => {
      const matchCat = !filters?.category || filters.category === 'all' || a.category === filters.category;
      const matchSearch = !filters?.search || a.title.toLowerCase().includes(filters.search.toLowerCase());
      return matchCat && matchSearch;
    });
  },
};

export default portalKnowledgeService;
