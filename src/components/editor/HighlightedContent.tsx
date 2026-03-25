interface HighlightedContentProps {
  content: string;
  onUpdate: (val: string) => void;
  keywords?: string[];
  activeTab: string;
}

export const HighlightedContent = ({ content, onUpdate, keywords, activeTab }: HighlightedContentProps) => {
  let highlighted = content;
  if (activeTab === "cv" && keywords) {
    keywords.forEach((kw: string) => {
      const regex = new RegExp(`(${kw})`, "gi");
      highlighted = highlighted.replace(regex, `<span class="bg-blue-50 dark:bg-blue-500/20 font-medium text-blue-900 dark:text-blue-200 border-b border-blue-200 dark:border-blue-500/40">$1</span>`);
    });
  }

  return (
    <div 
      className="text-[14px] md:text-[15px] text-gray-800 dark:text-slate-300 leading-[1.8] whitespace-pre-wrap outline-none p-6 md:p-10 font-sans min-h-[500px]"
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onUpdate(e.currentTarget.innerText)}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
};
