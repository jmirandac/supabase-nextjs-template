"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/lib/context/GlobalContext';

interface UserRow {
    id: string;
    email: string;
    role: string;
}

export default function AdminUsersPage() {
    const { user } = useGlobal();
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ROLE_USER');

    useEffect(() => {
        if (user && user.role !== 'ROLE_ADMIN') {
            router.push('/app');
        }
        loadUsers();
    }, [user]);

    async function loadUsers() {
        const res = await fetch('/api/admin/users');
        if (!res.ok) {
            const data = await res.json();
            setError(data.error || 'Failed to load');
            return;
        }
        const data = await res.json();
        setUsers(data.users);
    }

    async function createUser(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        if (!res.ok) {
            const d = await res.json();
            setError(d.error || 'Failed');
        } else {
            setEmail('');
            setPassword('');
            setRole('ROLE_USER');
            loadUsers();
        }
    }

    async function updateRole(id: string, role: string) {
        await fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, role })
        });
        loadUsers();
    }

    async function deleteUser(id: string) {
        await fetch('/api/admin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        loadUsers();
    }

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold">User Management</h1>
            {error && <p className="text-red-600">{error}</p>}
            <form onSubmit={createUser} className="space-y-2">
                <input className="border p-1" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <input className="border p-1" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <select className="border p-1" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="ROLE_USER">ROLE_USER</option>
                    <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                </select>
                <button type="submit" className="border px-2 py-1">Create</button>
            </form>
            <table className="min-w-full text-sm">
                <thead>
                    <tr>
                        <th className="border px-2">Email</th>
                        <th className="border px-2">Role</th>
                        <th className="border px-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td className="border px-2">{u.email}</td>
                            <td className="border px-2">
                                <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                                    <option value="ROLE_USER">ROLE_USER</option>
                                    <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                                </select>
                            </td>
                            <td className="border px-2">
                                <button onClick={() => deleteUser(u.id)} className="text-red-600">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
