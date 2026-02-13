import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, Search, UserCheck, UserX, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", email: "", phone: "", role: "staff" as string });

  const { data: users, refetch } = trpc.admin.listUsers.useQuery({ search, role: roleFilter });
  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => { toast.success("تم إنشاء المستخدم بنجاح"); setShowCreateDialog(false); refetch(); setNewUser({ fullName: "", email: "", phone: "", role: "staff" }); },
    onError: (err) => toast.error(err.message),
  });
  const toggleUser = trpc.admin.toggleUserStatus.useMutation({
    onSuccess: () => { toast.success("تم تحديث حالة المستخدم"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const roleLabels: Record<string, string> = { admin: "مدير النظام", manager: "مدير", staff: "موظف", user: "مستخدم" };
  const statusLabels: Record<string, string> = { active: "نشط", inactive: "معطّل" };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">إدارة المستخدمين</h1>
            <p className="text-navy/50 text-sm mt-1">إنشاء وتعديل وإدارة حسابات المستخدمين</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-navy hover:bg-gold-light">
                <Plus className="w-4 h-4 ml-2" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>الاسم الكامل</Label>
                  <Input value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} placeholder="أدخل الاسم الكامل" />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="example@alqasem.com.sa" dir="ltr" />
                </div>
                <div>
                  <Label>رقم الجوال</Label>
                  <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="05xxxxxxxx" dir="ltr" />
                </div>
                <div>
                  <Label>الدور</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير النظام</SelectItem>
                      <SelectItem value="manager">مدير</SelectItem>
                      <SelectItem value="staff">موظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-gold text-navy hover:bg-gold-light" onClick={() => createUser.mutate(newUser)} disabled={createUser.isPending}>
                  {createUser.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
                <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="كل الأدوار" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأدوار</SelectItem>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                  <SelectItem value="staff">موظف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-dark bg-sand/50">
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">الاسم</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">البريد</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">الدور</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">آخر دخول</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-navy/40">لا يوجد مستخدمون</td></tr>
                  ) : (
                    (users ?? []).map((u: any) => (
                      <tr key={u.id} className="border-b border-sand/50 hover:bg-sand/30">
                        <td className="py-3 px-4 text-navy font-medium">{u.name || u.fullName || "-"}</td>
                        <td className="py-3 px-4 text-navy/70" dir="ltr">{u.email || "-"}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-navy/10 text-navy text-xs rounded">{roleLabels[u.role] || u.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${u.status === "active" || !u.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {statusLabels[u.status] || "نشط"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-navy/50 text-xs">
                          {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString("ar-SA") : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleUser.mutate({ userId: u.id, status: u.status === "active" ? "inactive" : "active" })}>
                              {u.status === "active" || !u.status ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
