/**
 * Triggers a browser download of a text file.
 * Uses native Blob + URL.createObjectURL — no dependencies.
 */

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
