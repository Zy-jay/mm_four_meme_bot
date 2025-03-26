// export function escapeMarkdown(text: string): string {
//   return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
// }
export function escapeMarkdown(text: string) {
  return (
    text
      .replace(/_/g, "\\_")
      // .replace(/\*/g, "\\*")
      .replace(/\[/g, "\\[")
      .replace(/]/g, "\\]")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/~/g, "\\~")
      // .replace(/`/g, "\\`")
      .replace(/>/g, "\\>")
      .replace(/#/g, "\\#")
      .replace(/\+/g, "\\+")
      .replace(/-/g, "\\-")
      .replace(/=/g, "\\=")
      .replace(/\|/g, "\\|")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\./g, "\\.")
      .replace(/!/g, "\\!")
  );
}
