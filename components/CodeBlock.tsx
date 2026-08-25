import React, { useState } from 'react';
import { CopyIcon, CheckIcon, ExternalLinkIcon } from './Icons';

interface CodeBlockProps {
    code: string;
    remixLink: string;
    contractName: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, remixLink, contractName }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="relative bg-gray-900 rounded-lg h-full border border-gray-700 shadow-lg flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 border-b border-gray-700 rounded-t-lg">
                <span className="text-sm font-medium text-gray-400">{contractName}.sol</span>
                <div className="flex items-center space-x-4">
                    {remixLink && (
                         <a
                            href={remixLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <ExternalLinkIcon className="mr-1" /> Open in Remix
                        </a>
                    )}
                    <button
                        onClick={handleCopy}
                        className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {isCopied ? (
                            <>
                               <CheckIcon className="mr-1" /> Copied
                            </>
                        ) : (
                            <>
                               <CopyIcon className="mr-1" /> Copy
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div className="p-4 overflow-auto flex-grow">
                <pre className="text-sm">
                    <code className="language-solidity font-mono">{code}</code>
                </pre>
            </div>
        </div>
    );
};