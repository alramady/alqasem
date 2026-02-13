import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, Search, UserCheck, UserX, Edit, Trash2, Key, Eye, EyeOff, Loader2, Shield, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const roleLabels: Record<string, string> = { admin: "مدير النظام", manager: "مدير", staff: "موظف", user: "مستخدم" };
const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-blue-100 text-blue-700",
  staff: "bg-green-100 text-green-700",
  user: "bg-gray-100 text-gray-700",
};
const statusLabels: Record<string, string> = { active: "نشط", inactive: "معطّل" };

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetPwDialog, setShowResetPwDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [newUser, setNewUser] = useState({
    fullName: "", username: "", password: "", email: "", phone: "", role: "staff" as "admin" | "manager" | "staff",
  });
  const [editData, setEditData] = useState({
    id: 0, fullName: "", email: "", phone: "", role: "", status: "",
  });
  const [resetPwData, setResetPwData] = useState({ userId: 0, userName: "", newPassword: "" });

  const { data: users, refetch } = trpc.admin.listUsers.useQuery({ search, role: roleFilter });

  const createUser = trpc.admin.createUserWithCredentials.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المستخدم بنجاح");
      setShowCreateDialog(false);
      refetch();
      setNewUser({ fullName: "", username: "", password: "", email: "", phone: "", role: "staff" });
      setShowPassword(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المستخدم بنجاح");
      setShowEditDialog(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleUser = trpc.admin.toggleUserStatus.useMutation({
    onSuccess: () => { toast.success("تم تحديث حالة المستخدم"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success("تم حذف المستخدم"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const resetPassword = trpc.admin.adminResetUserPassword.useMutation({
    onSuccess: () => {
      toast.success("تم إعادة تعيين كلمة المرور");
      setShowResetPwDialog(false);
      setResetPwData({ userId: 0, userName: "", newPassword: "" });
      setShowPassword(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const openEditDialog = (user: any) => {
    setEditData({
      id: user.id,
      fullName: user.fullName || user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "staff",
      status: user.status || "active",
    });
    setShowEditDialog(true);
  };

  const openResetPwDialog = (user: any) => {
    setResetPwData({ userId: user.id, userName: user.fullName || user.name || "", newPassword: "" });
    setShowPassword(false);
    setShowResetPwDialog(true);
  };

  const handleCreate = () => {
    if (!newUser.fullName || !newUser.username || !newUser.password || !newUser.email) {
      toast.error("جميع الحقول المطلوبة يجب تعبئتها");
      return;
    }
    if (newUser.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    createUser.mutate(newUser);
  };

  const handleUpdate = () => {
    updateUser.mutate(editData);
  };

  const handleResetPassword = () => {
    if (!resetPwData.newPassword || resetPwData.newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    resetPassword.mutate({ userId: resetPwData.userId, newPassword: resetPwData.newPassword });
  };

  const userCount = (users ?? []).length;
  const adminCount = (users ?? []).filter((u: any) => u.role === "admin").length;
  const managerCount = (users ?? []).filter((u: any) => u.role === "manager").length;
  const staffCount = (users ?? []).filter((u: any) => u.role === "staff").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">إدارة المستخدمين</h1>
            <p className="text-navy/50 text-sm mt-1">إنشاء وتعديل وإدارة حسابات المستخدمين والصلاحيات</p>
          </div>
          <Button className="bg-gold text-navy hover:bg-gold-light" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة مستخدم
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <UsersIcon className="w-5 h-5 text-navy/40 mx-auto mb-1" />
              <p className="text-2xl font-bold text-navy">{userCount}</p>
              <p className="text-xs text-navy/50">إجمالي المستخدمين</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Shield className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-navy">{adminCount}</p>
              <p className="text-xs text-navy/50">مدراء النظام</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Shield className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-navy">{managerCount}</p>
              <p className="text-xs text-navy/50">مدراء</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Shield className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-navy">{staffCount}</p>
              <p className="text-xs text-navy/50">موظفين</p>
            </CardContent>
          </Card>
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
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">اسم المستخدم</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">البريد</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">الهاتف</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">الدور</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">آخر دخول</th>
                    <th className="text-right py-3 px-4 text-navy/60 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-navy/40">لا يوجد مستخدمون</td></tr>
                  ) : (
                    (users ?? []).map((u: any) => (
                      <tr key={u.id} className="border-b border-sand/50 hover:bg-sand/30">
                        <td className="py-3 px-4 text-navy font-medium">{u.fullName || u.name || "-"}</td>
                        <td className="py-3 px-4 text-navy/70 font-mono text-xs" dir="ltr">{u.username || "-"}</td>
                        <td className="py-3 px-4 text-navy/70 text-xs" dir="ltr">{u.email || "-"}</td>
                        <td className="py-3 px-4 text-navy/70 text-xs" dir="ltr">{u.phone || "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>
                            {roleLabels[u.role] || u.role}
                          </span>
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
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="تعديل" onClick={() => openEditDialog(u)}>
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="إعادة تعيين كلمة المرور" onClick={() => openResetPwDialog(u)}>
                              <Key className="w-4 h-4 text-amber-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={u.status === "active" ? "تعطيل" : "تفعيل"} onClick={() => toggleUser.mutate({ userId: u.id, status: u.status === "active" ? "inactive" : "active" })}>
                              {u.status === "active" || !u.status ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="حذف">
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف المستخدم؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيتم حذف حساب "{u.fullName || u.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteUser.mutate({ userId: u.id })}>
                                    حذف نهائي
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input
                    placeholder="أدخل الاسم الكامل"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم المستخدم *</Label>
                  <Input
                    placeholder="اسم المستخدم للدخول"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="6 أحرف على الأقل"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    dir="ltr"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني *</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    placeholder="+966..."
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الدور</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <span className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-red-500" /> مدير النظام — صلاحيات كاملة
                      </span>
                    </SelectItem>
                    <SelectItem value="manager">
                      <span className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-blue-500" /> مدير — إدارة المحتوى والطلبات
                      </span>
                    </SelectItem>
                    <SelectItem value="staff">
                      <span className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-green-500" /> موظف — عرض وإضافة فقط
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="outline">إلغاء</Button>
              </DialogClose>
              <Button className="bg-gold text-navy hover:bg-gold-light" onClick={handleCreate} disabled={createUser.isPending}>
                {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                إنشاء المستخدم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تعديل المستخدم</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  value={editData.fullName}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Select value={editData.role} onValueChange={(v) => setEditData({ ...editData, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير النظام</SelectItem>
                      <SelectItem value="manager">مدير</SelectItem>
                      <SelectItem value="staff">موظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">معطّل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="outline">إلغاء</Button>
              </DialogClose>
              <Button className="bg-gold text-navy hover:bg-gold-light" onClick={handleUpdate} disabled={updateUser.isPending}>
                {updateUser.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={showResetPwDialog} onOpenChange={setShowResetPwDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-navy/60">
                إعادة تعيين كلمة المرور للمستخدم: <strong>{resetPwData.userName}</strong>
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                سيتم تسجيل خروج المستخدم من جميع الأجهزة بعد إعادة التعيين.
              </p>
              <div className="space-y-2">
                <Label>كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="6 أحرف على الأقل"
                    value={resetPwData.newPassword}
                    onChange={(e) => setResetPwData({ ...resetPwData, newPassword: e.target.value })}
                    dir="ltr"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="outline">إلغاء</Button>
              </DialogClose>
              <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={handleResetPassword} disabled={resetPassword.isPending}>
                {resetPassword.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                إعادة تعيين
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
