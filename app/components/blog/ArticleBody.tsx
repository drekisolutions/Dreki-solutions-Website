import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { richHtml, type RichNode } from "@/lib/blog/rich-content";
export default function ArticleBody({
  body,
  richDoc,
}: {
  body: string;
  richDoc?: RichNode;
}) {
  if (richDoc)
    return (
      <div
        className="article-prose"
        dangerouslySetInnerHTML={{ __html: richHtml(richDoc) }}
      />
    );
  return (
    <div className="article-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => (
            <a href={href} rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
