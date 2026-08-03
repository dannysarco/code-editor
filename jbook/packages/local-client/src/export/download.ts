// Hands content to the browser as a file download via a temporary object URL.
export const downloadFile = (
  content: string,
  filename: string,
  type: string
): void => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
