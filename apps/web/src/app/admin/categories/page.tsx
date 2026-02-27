"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, GripVertical } from "lucide-react";

// Proper slugify to handle Vietnamese characters
const slugify = (str: string) => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-z0-9 -]/g, "") // Remove invalid chars
        .replace(/\s+/g, "-") // Collapse whitespace and replace by -
        .replace(/-+/g, "-"); // Collapse dashes
};

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [desc, setDesc] = useState("");
    const [showOnHeader, setShowOnHeader] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    const fetchCategories = () => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories`)
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories/${editingId}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories`;
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, slug, description: desc, showOnHeader }),
            });
            if (res.ok) {
                fetchCategories();
                setName("");
                setSlug("");
                setDesc("");
                setShowOnHeader(false);
                setEditingId(null);
                alert(editingId ? "Đã cập nhật chuyên mục!" : "Đã thêm chuyên mục!");
            } else {
                alert("Lỗi khi lưu!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa?")) return;
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories/${id}`, { method: "DELETE" });
        fetchCategories();
    };

    const toggleHeader = async (id: number, current: boolean) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ showOnHeader: !current }),
            });
            if (res.ok) fetchCategories();
        } catch (e) { console.error(e); }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
        // Optionally set drag image if needed, but defaults are fine
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIdx(index);
    };

    const handleDragEnd = async () => {
        if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) {
            const newOrder = [...categories];
            const [movedItem] = newOrder.splice(draggedIdx, 1);
            newOrder.splice(dragOverIdx, 0, movedItem);

            setCategories(newOrder); // Optimistic UI update

            // Save new order to backend (listOrder = index)
            const payload = newOrder.map((cat, idx) => ({ id: cat.id, listOrder: idx }));

            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories/reorder`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: payload })
                });
            } catch (err) {
                console.error("Failed to reorder categories", err);
            }
        }

        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    const handleEdit = (cat: any) => {
        setEditingId(cat.id);
        setName(cat.name);
        setSlug(cat.slug);
        setDesc(cat.description || "");
        setShowOnHeader(cat.showOnHeader || false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName("");
        setSlug("");
        setDesc("");
        setShowOnHeader(false);
    };

    return (
        <div className="max-w-5xl">
            <h1 className="text-2xl font-bold mb-6">Quản lý Chuyên mục</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <h2 className="font-semibold mb-4 text-lg">
                        {editingId ? "Sửa Chuyên mục" : "Thêm Chuyên mục mới"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị</label>
                            <input
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (!editingId) {
                                        setSlug(slugify(e.target.value));
                                    }
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                placeholder="VD: Thể thao"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                            <input
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                                placeholder="the-thao"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                            <textarea
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg h-24"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showOnHeader}
                                    onChange={(e) => setShowOnHeader(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                />
                                Hiển thị trên thanh Menu chính (Header)
                            </label>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button type="submit" className="flex-1 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium">
                                {editingId ? <Edit size={18} /> : <Plus size={18} />}
                                {editingId ? "Cập nhật" : "Thêm"}
                            </button>
                            {editingId && (
                                <button type="button" onClick={cancelEdit} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-600">
                            <tr>
                                <th className="px-4 py-3 w-10"></th>
                                <th className="px-4 py-3">Tên</th>
                                <th className="px-4 py-3">Slug</th>
                                <th className="px-4 py-3 text-center">Lên Header</th>
                                <th className="px-4 py-3">Mô tả</th>
                                <th className="px-4 py-3 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Đang tải...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Chưa có chuyên mục nào.</td></tr>
                            ) : (
                                categories.map((cat: any, index: number) => (
                                    <tr
                                        key={cat.id}
                                        className={`hover:bg-slate-50 transition-colors ${dragOverIdx === index ? 'bg-blue-50/50 border-t-2 border-blue-400' : ''} ${draggedIdx === index ? 'opacity-50 grayscale' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnter={(e) => handleDragEnter(e, index)}
                                        onDragOver={(e) => e.preventDefault()} // necessary to allow drop
                                        onDragEnd={handleDragEnd}
                                    >
                                        <td className="px-4 py-3 text-slate-400 cursor-grab active:cursor-grabbing text-center">
                                            <GripVertical size={16} />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                                        <td className="px-4 py-3 font-mono text-slate-500">{cat.slug}</td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={cat.showOnHeader}
                                                onChange={() => toggleHeader(cat.id, cat.showOnHeader)}
                                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                                title="Bật/Tắt hiển thị Header"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{cat.description}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
