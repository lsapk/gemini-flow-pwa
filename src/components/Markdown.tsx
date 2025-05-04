
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownProps {
  content: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  return (
    <ReactMarkdown
      className="prose prose-sm dark:prose-invert max-w-none break-words"
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !className;
          return !isInline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // Add styles for other markdown elements
        h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-3" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-4 mb-2" {...props} />,
        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
