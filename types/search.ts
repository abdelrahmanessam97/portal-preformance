export type SearchItem = {
  id: number;
  title: string;
  title_ar?: string;
  title_en?: string;
};

export interface SearchResponse {
  status_code: number;
  message: string;
  data: {
    search_query: string;
    total_results: number;
    results: {
      categories: { data: SearchItem[] };
      folders: { data: SearchItem[] };
      files: { data: SearchItem[] };
      attachments: {
        data: {
          id: number;
          file_id: number | null;
          title: string;
          file: string;
          size: number;
          created_at: string;
        }[];
      };
    };
  };
}
