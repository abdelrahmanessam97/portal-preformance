export interface RecycleItem {
  id: number;
  title: string;
}

export interface RecycleListResponse {
  status_code: number;
  message: string;
  data: RecycleItem[];
  meta: {
    current_page: number;
    total: number;
    per_page: number;
  };
}
