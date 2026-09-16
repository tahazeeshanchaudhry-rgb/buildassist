function renderInline(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded-md border border-[#e5ebee] bg-[#f4f7f8] px-1.5 py-0.5 font-mono text-[.82em] text-[#254864]">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <span key={index}>{part}</span>;
  });
}

function parseTableRow(line: string) {
  return line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  const cells = parseTableRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export default function MarkdownText({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    if (line.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim())) {
      const headers = parseTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().includes("|") && lines[index].trim()) {
        rows.push(parseTableRow(lines[index].trim()));
        index += 1;
      }
      blocks.push(<div key={index} className="my-5 max-w-full overflow-x-auto rounded-xl border border-[#dfe7eb] bg-white shadow-[0_2px_8px_rgb(15_42_68_/_4%)]"><table className="w-full min-w-max border-collapse text-left text-[.82rem]"><thead className="bg-[#0F2A44] text-white"><tr>{headers.map((header, headerIndex) => <th key={headerIndex} className="border-b-2 border-[#D8A017] px-4 py-3 text-xs font-bold tracking-wide">{renderInline(header)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-[#edf1f3] last:border-b-0 even:bg-[#f8fafb]">{headers.map((_, cellIndex) => <td key={cellIndex} className="max-w-[22rem] whitespace-normal break-words px-4 py-3 leading-5 text-[#516378]">{renderInline(row[cellIndex] ?? "")}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (index < lines.length && (lines[index].trim().startsWith("- ") || lines[index].trim().startsWith("* "))) items.push(lines[index++].trim().slice(2));
      blocks.push(<ul key={index} className="my-3 list-disc space-y-1.5 pl-5 marker:text-[#D8A017]">{items.map((item, itemIndex) => <li key={itemIndex} className="break-words pl-1 leading-6">{renderInline(item)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index].trim())) items.push(lines[index++].trim().replace(/^\d+\. /, ""));
      blocks.push(<ol key={index} className="my-3 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#a97806]">{items.map((item, itemIndex) => <li key={itemIndex} className="break-words pl-1 leading-6">{renderInline(item)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith("#")) {
      const level = Math.min(line.match(/^#+/)?.[0].length ?? 3, 3);
      const heading = line.replace(/^#+\s*/, "");
      const Heading = `h${level + 1}` as "h2" | "h3" | "h4";
      blocks.push(<Heading key={index} className={`${level === 1 ? "mb-2 mt-6 text-lg" : level === 2 ? "mb-2 mt-5 text-base" : "mb-2 mt-4 text-sm"} break-words font-bold tracking-tight text-[#203b53] first:mt-0`}>{renderInline(heading)}</Heading>);
      index += 1;
      continue;
    }
    if (/^(---+|\*\*\*+|___+)$/.test(line)) {
      blocks.push(<hr key={index} className="my-5 border-0 border-t border-[#dfe7eb]" />);
      index += 1;
      continue;
    }
    blocks.push(<p key={index} className="my-3 break-words leading-7 [overflow-wrap:anywhere] first:mt-0 last:mb-0">{renderInline(line)}</p>);
    index += 1;
  }

  return <div className="min-w-0 max-w-full break-words text-[.875rem] leading-7 [overflow-wrap:anywhere]">{blocks}</div>;
}
