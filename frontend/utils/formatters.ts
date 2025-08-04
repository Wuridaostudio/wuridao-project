// utils/formatters.ts
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const stripHtml = (html: string): string => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export const truncate = (text: string, length: number = 100): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};
