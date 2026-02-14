import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Shield, Save, RefreshCw, Info } from "lucide-react";

const moduleLabels: Record<string, string> = {
  dashboard: "لوحة المعلومات", properties: "العقارات", projects: "المشاريع",
  inquiries: "الطلبات", cms: "إدارة المحتوى", media: "مكتبة الوسائط",
  reports: "التقارير", settings: "الإعدادات", users: "المستخدمون",
  audit_log: "سجل النشاطات", notifications: "التنبيهات", messages: "المراسلات",
};

const actionFields = ["canView", "canCreate", "canEdit", "canDelete", "canExport"] as const;
type ActionField = typeof actionFields[number];

const actionLabels: Record<string, string> = {
  canView: "عرض", canCreate: "إنشاء", canEdit: "تعديل", canDelete: "حذف", canExport: "تصدير",
};

const roleLabels: Record<string, string> = {
  admin: "مدير النظام", manager: "مشرف", staff: "موظف",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700", manager: "bg-blue-100 text-blue-700", staff: "bg-green-100 text-green-700",
};

type PermEntry = { role: string; module: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean };

const defaultPerms: Record<string, Record<string, PermEntry>> = {
  admin: Object.fromEntries(Object.keys(moduleLabels).map(m => [m, { role: "admin", module: m, canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true }])),
  manager: Object.fromEntries(Object.keys(moduleLabels).map(m => [m, { role: "manager", module: m, canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true }])),
  staff: Object.fromEntries(Object.keys(moduleLabels).map(m => [m, { role: "staff", module: m, canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false }])),
};

export default function AdminPermissions() {
  const [activeRole, setActiveRole] = useState("admin");
  const [permMatrix, setPermMatrix] = useState<Record<string, Record<string, PermEntry>>>(defaultPerms);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());

  const { data: dbPermissions, refetch } = trpc.admin.getPermissions.useQuery();
  const updatePerm = trpc.admin.updatePermission.useMutation({
    onSuccess: () => {
      setPendingSaves(prev => { const n = new Set(prev); n.delete("current"); return n; });
    },
    onError: (err: any) => toast.error(err.message),
  });
  const initPerms = trpc.admin.initPermissions.useMutation({
    onSuccess: () => { toast.success("تم تهيئة الصلاحيات الافتراضية"); refetch(); },
  });

  useEffect(() => {
    if (dbPermissions && (dbPermissions as any[]).length > 0) {
      const newMatrix = JSON.parse(JSON.stringify(defaultPerms));
      (dbPermissions as any[]).forEach((p: any) => {
        if (newMatrix[p.role]) {
          newMatrix[p.role][p.module] = {
            role: p.role, module: p.module,
            canView: !!p.canView, canCreate: !!p.canCreate, canEdit: !!p.canEdit,
            canDelete: !!p.canDelete, canExport: !!p.canExport,
          };
        }
      });
      setPermMatrix(newMatrix);
    }
  }, [dbPermissions]);

  const togglePermission = (role: string, module: string, field: ActionField) => {
    setPermMatrix(prev => {
      const entry = prev[role]?.[module] || { role, module, canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };
      return {
        ...prev,
        [role]: {
          ...prev[role],
          [module]: { ...entry, [field]: !entry[field] },
        },
      };
    });
    setHasChanges(true);
  };

  const savePermissions = async () => {
    const role = activeRole;
    const modules = permMatrix[role] || {};
    let count = 0;
    for (const [mod, entry] of Object.entries(modules)) {
      await updatePerm.mutateAsync({
        role: entry.role, module: entry.module,
        canView: entry.canView, canCreate: entry.canCreate, canEdit: entry.canEdit,
        canDelete: entry.canDelete, canExport: entry.canExport,
      });
      count++;
    }
    toast.success(`تم حفظ ${count} صلاحية بنجاح`);
    setHasChanges(false);
    refetch();
  };

  const modules = Object.keys(moduleLabels);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1b33]">إدارة الصلاحيات</h1>
            <p className="text-muted-foreground text-sm mt-1">تحكم بصلاحيات كل دور في النظام</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => initPerms.mutate()} disabled={initPerms.isPending}>
              <RefreshCw className="h-4 w-4 ml-2" /> تهيئة الافتراضي
            </Button>
            {hasChanges && (
              <Button onClick={savePermissions} className="bg-[#c8a45e] hover:bg-[#b8943e] text-white" disabled={updatePerm.isPending}>
                <Save className="h-4 w-4 ml-2" /> حفظ التغييرات
              </Button>
            )}
          </div>
        </div>

        <Card className="border-0 bg-blue-50 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">نظام الصلاحيات (RBAC)</p>
              <p className="text-xs text-blue-600 mt-1">
                يمكنك تخصيص صلاحيات كل دور (مدير، مشرف، موظف) لكل قسم في لوحة التحكم. فعّل أو عطّل الإجراءات المسموحة لكل دور.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeRole} onValueChange={setActiveRole}>
          <TabsList className="bg-white border">
            {Object.entries(roleLabels).map(([role, label]) => (
              <TabsTrigger key={role} value={role} className="gap-2">
                <Shield className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(roleLabels).map((role) => (
            <TabsContent key={role} value={role}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`${roleColors[role]}`}>{roleLabels[role]}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {role === "admin" ? "صلاحيات كاملة على جميع الأقسام" :
                       role === "manager" ? "صلاحيات إدارة المحتوى والعمليات" :
                       "صلاحيات عرض محدودة"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium w-40">القسم</th>
                          {actionFields.map(field => (
                            <th key={field} className="text-center py-3 px-3 text-muted-foreground font-medium text-xs">
                              {actionLabels[field]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {modules.map(module => {
                          const entry = permMatrix[role]?.[module];
                          return (
                            <tr key={module} className="border-b hover:bg-[#f8f6f3] transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-medium text-[#0f1b33] text-xs">{moduleLabels[module]}</span>
                              </td>
                              {actionFields.map(field => (
                                <td key={field} className="text-center py-3 px-3">
                                  <Switch
                                    checked={entry?.[field] ?? false}
                                    onCheckedChange={() => togglePermission(role, module, field)}
                                    className="data-[state=checked]:bg-[#c8a45e]"
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
