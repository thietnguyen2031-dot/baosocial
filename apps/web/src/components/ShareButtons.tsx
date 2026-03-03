'use client';

import { useState } from 'react';

interface ShareButtonsProps {
    url: string;
    title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    const xUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const btnBase = 'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95';

    return (
        <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-600 mr-1">Chia sẻ:</span>

            {/* Facebook */}
            <a href={fbUrl} target="_blank" rel="noopener noreferrer"
                className={`${btnBase} bg-[#1877F2] text-white hover:bg-[#166FE5]`}
                aria-label="Chia sẻ lên Facebook"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.031 4.388 11.03 10.125 11.927V15.563H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.103 24 18.104 24 12.073z" />
                </svg>
                Facebook
            </a>

            {/* X (Twitter) */}
            <a href={xUrl} target="_blank" rel="noopener noreferrer"
                className={`${btnBase} bg-black text-white hover:bg-slate-800`}
                aria-label="Chia sẻ lên X"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X
            </a>

            {/* Copy Link */}
            <button onClick={handleCopy}
                className={`${btnBase} ${copied ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                aria-label="Sao chép đường dẫn"
            >
                {copied ? (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Đã sao chép!
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy link
                    </>
                )}
            </button>
        </div>
    );
}
