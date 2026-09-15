function renderInline(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-slate-100 px-1 py-0.5 text-xs">{part.slice(1, -1)}</code>;
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
      blocks.push(<div key={index} className="my-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full border-collapse text-left text-sm"><thead className="bg-[#0F2A44] text-white"><tr>{headers.map((header, headerIndex) => <th key={headerIndex} className="whitespace-nowrap border-b border-[#D8A017] px-4 py-3 font-semibold">{renderInline(header)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-slate-100 last:border-b-0 even:bg-slate-50">{headers.map((_, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-4 py-3 text-slate-600">{renderInline(row[cellIndex] ?? "")}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (index < lines.length && (lines[index].trim().startsWith("- ") || lines[index].trim().startsWith("* "))) items.push(lines[index++].trim().slice(2));
      blocks.push(<ul key={index} className="my-2 list-disc space-y-1 pl-5">{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index].trim())) items.push(lines[index++].trim().replace(/^\d+\. /, ""));
      blocks.push(<ol key={index} className="my-2 list-decimal space-y-1 pl-5">{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith("#")) {
      const heading = line.replace(/^#+\s*/, "");
      blocks.push(<h3 key={index} className="my-3 font-semibold text-slate-800">{renderInline(heading)}</h3>);
      index += 1;
      continue;
    }
    blocks.push(<p key={index} className="my-2">{renderInline(line)}</p>);
    index += 1;
  }

  return <div>{blocks}</div>;
}
