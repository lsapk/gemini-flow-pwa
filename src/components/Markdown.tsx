import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      className="prose prose-sm max-w-none break-words dark:prose-invert"
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        a: ({ node: _node, ...props }) => (
          <a
            {...props}
            className="text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          />
        ),
        img: ({ alt }) => (
          <span className="text-muted-foreground">
            [Image : {alt || "illustration"}]
          </span>
        ),
        pre: ({ node: _node, ...props }) => (
          <pre
            {...props}
            className="overflow-x-auto rounded-xl bg-muted p-4 text-xs text-foreground"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
