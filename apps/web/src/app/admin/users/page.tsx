"use client";

import { useEffect, useState } from "react";


export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<any>(null); // null = not editing

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        fetch("http://localhost:3001/users")
            .then((res) => res.json())
            .then((data) => {
                setUsers(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleSaveUser = async (user: any) => {
        try {
            const res = await fetch(`http://localhost:3001/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: user.role, status: user.status }),
            });
            if (res.ok) {
                alert("Cập nhật thành công!");
                setEditingUser(null);
                fetchUsers();
            } else {
                alert("Lỗi khi cập nhật");
            }
        } catch (e) {
            alert("Lỗi kết nối");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Quản lý thành viên</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Avatar</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Tên</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Vai trò</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Trạng thái</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Ngày tham gia</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : <span className="font-bold text-slate-500">{user.name?.[0]}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {user.status || 'active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setEditingUser(user)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Chỉnh sửa thành viên</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên</label>
                                <input disabled value={editingUser.name} className="w-full px-3 py-2 bg-slate-100 rounded border border-slate-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input disabled value={editingUser.email} className="w-full px-3 py-2 bg-slate-100 rounded border border-slate-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Vai trò</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full px-3 py-2 rounded border border-slate-300"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                <select
                                    value={editingUser.status || 'active'}
                                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                                    className="w-full px-3 py-2 rounded border border-slate-300"
                                >
                                    <option value="active">Hoạt động (Active)</option>
                                    <option value="banned">Cấm (Banned)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleSaveUser(editingUser)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
