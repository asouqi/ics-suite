import React from "react"

interface CodeViewerProps {
  code: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({code}) => {
  // Tokenize lines to match the syntax rules in your index.css
  const tokenize = (text: string) => {
    // Regex matches comments, strings, or common JS/TS keywords
    const tokens = text.split(/(\/\/.*|["'`].*?["'`]|\bimport\b|\bfrom\b|\bconst\b|\breturn\b|\bnew\b)/g);

    return tokens.map((token, index) => {
      if (token.startsWith("//")) {
        return <span key={index} className="token-comment">{token}</span>;
      }
      if (token.startsWith("'") || token.startsWith('"') || token.startsWith("`")) {
        return <span key={index} className="token-string">{token}</span>;
      }
      if (["import", "from", "const", "return", "new"].includes(token)) {
        return <span key={index} className="token-keyword">{token}</span>;
      }
      return token;
    });
  };

  return (
    <pre className="code-block text-xs sm:text-sm rounded-xl shadow-inner">
      <code>{tokenize(code)}</code>
    </pre>
  )
}

export default CodeViewer