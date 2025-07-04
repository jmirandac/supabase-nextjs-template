"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);

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

    async function deleteUserConfirmed() {
        if (!userToDelete) return;
        await fetch('/api/admin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userToDelete.id })
        });
        setShowDeleteDialog(false);
        setUserToDelete(null);
        loadUsers();
    }

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage users and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={createUser} className="flex flex-col md:flex-row gap-2 mb-6">
                        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required />
                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                        <select className="border rounded-md px-3 py-2 text-base md:text-sm" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="ROLE_USER">ROLE_USER</option>
                            <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                        </select>
                        <Button type="submit">Create</Button>
                    </form>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold">Email</th>
                                    <th className="px-4 py-2 text-left font-semibold">Role</th>
                                    <th className="px-4 py-2 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b last:border-b-0">
                                        <td className="px-4 py-2">{u.email}</td>
                                        <td className="px-4 py-2">
                                            <select
                                                className="border rounded-md px-2 py-1 text-sm"
                                                value={u.role}
                                                onChange={e => updateRole(u.id, e.target.value)}
                                            >
                                                <option value="ROLE_USER">ROLE_USER</option>
                                                <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setUserToDelete(u);
                                                    setShowDeleteDialog(true);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteUserConfirmed} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
