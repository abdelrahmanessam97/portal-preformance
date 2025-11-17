import type { NewsDTO, NewsItem } from "../../../types/news";

function splitCreatedAt(createdAt: string): { date: string; time: string } {
  const raw = (createdAt ?? "").trim();
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    return {
      date: parts[0] || new Date().toLocaleDateString("en-US"),
      time: parts.slice(1).join(" ") || new Date().toLocaleTimeString("en-US"),
    };
  }
  return {
    date: raw || new Date().toLocaleDateString("en-US"),
    time: new Date().toLocaleTimeString("en-US"),
  };
}

export function dtoToItem(dto: NewsDTO): NewsItem {
  const { date, time } = splitCreatedAt(dto.created_at);
  return {
    id: dto.id,
    titleEn: dto.title_en,
    titleAr: dto.title_ar,
    descriptionEn: dto.description_en,
    descriptionAr: dto.description_ar,
    images: (dto.attachments ?? []).map((a) => a.file).filter(Boolean),
    attachmentIds: (dto.attachments ?? []).map((a) => a.id),
    author: "",
    date,
    time,
  };
}
