"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NewsItem {
    id: number;
    title: string;
    summary: string;
    category: string;
    timestamp: string;
    imageUrl: string;
    author: string;
}

const FEATURED_NEWS: NewsItem[] = [
    {
        id: 1,
        title: "AI đang thay đổi cách chúng ta đọc tin tức như thế nào?",
        summary: "Trí tuệ nhân tạo không chỉ giúp tổng hợp thông tin mà còn cá nhân hóa trải nghiệm đọc, mang lại cái nhìn đa chiều hơn về các sự kiện toàn cầu.",
        category: "Công nghệ",
        timestamp: "2 giờ trước",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1600",
        author: "Minh Anh"
    },
    {
        id: 2,
        title: "Tương lai của năng lượng tái tạo tại Việt Nam",
        summary: "Những dự án điện gió ngoài khơi mới đang mở ra cơ hội lớn cho nền kinh tế xanh, giảm thiểu sự phụ thuộc vào nhiên liệu hóa thạch.",
        category: "Kinh Tế",
        timestamp: "1 giờ trước",
        imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=1600",
        author: "Quốc Bảo"
    },
    {
        id: 3,
        title: "Di sản văn hóa Huế: Bảo tồn và phát triển",
        summary: "Nỗ lực số hóa các di tích lịch sử giúp du khách quốc tế dễ dàng tiếp cận và hiểu rõ hơn về văn hóa Cố đô.",
        category: "Văn Hóa",
        timestamp: "3 giờ trước",
        imageUrl: "https://images.unsplash.com/photo-1558507851-f76db9e4c3aa?auto=format&fit=crop&q=80&w=1600",
        author: "Hương Giang"
    },
    {
        id: 4,
        title: "Đội tuyển bóng đá nữ Việt Nam và hành trình World Cup",
        summary: "Nhìn lại chặng đường đầy thử thách và vinh quang của các cô gái vàng, hướng tới những mục tiêu xa hơn.",
        category: "Thể Thao",
        timestamp: "30 phút trước",
        imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1600",
        author: "Tuấn Tú"
    },
    {
        id: 5,
        title: "Sự trỗi dậy của Podcast trong giới trẻ",
        summary: "Tại sao hình thức nghe tin tức và giải trí này lại trở thành xu hướng không thể thiếu trong cuộc sống hiện đại?",
        category: "Video",
        timestamp: "4 giờ trước",
        imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=1600",
        author: "Lan Nhi"
    }
];

export default function FeaturedCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % FEATURED_NEWS.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + FEATURED_NEWS.length) % FEATURED_NEWS.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[2.5/1] rounded-2xl overflow-hidden group shadow-xl">
            {/* Slides */}
            {FEATURED_NEWS.map((item, index) => (
                <div
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                >
                    <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent">
                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-16 flex flex-col items-start gap-4">
                            <span className="bg-[var(--color-cta)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide animate-fade-in">
                                Nổi bật • {item.category}
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-white leading-tight max-w-4xl drop-shadow-md">
                                {item.title}
                            </h2>
                            <p className="hidden md:block text-slate-200 text-lg max-w-2xl line-clamp-2">
                                {item.summary}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-purple-500"></div>
                                <div className="text-sm font-medium text-slate-200">
                                    {item.author} <span className="opacity-50 mx-1">•</span> {item.timestamp}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Controls */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-6 right-6 md:right-12 z-20 flex gap-2">
                {FEATURED_NEWS.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? "w-8 bg-[var(--color-cta)]" : "w-2 bg-white/50 hover:bg-white/80"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
