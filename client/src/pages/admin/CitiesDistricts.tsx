import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Building2, Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight, ToggleLeft } from "lucide-react";

export default function CitiesDistricts() {
  const utils = trpc.useUtils();

  // State
  const [search, setSearch] = useState("");
  const [expandedCity, setExpandedCity] = useState<number | null>(null);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [districtDialogOpen, setDistrictDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [editingDistrict, setEditingDistrict] = useState<any>(null);
  const [selectedCityForDistrict, setSelectedCityForDistrict] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "city" | "district"; id: number; name: string } | null>(null);

  // Form state
  const [cityForm, setCityForm] = useState({ nameAr: "", nameEn: "", sortOrder: 0 });
  const [districtForm, setDistrictForm] = useState({ nameAr: "", nameEn: "", sortOrder: 0 });

  // Queries
  const { data: citiesList = [], isLoading } = trpc.admin.listCities.useQuery({ includeInactive: true });
  const { data: districtsList = [] } = trpc.admin.listDistricts.useQuery({ includeInactive: true });

  // Mutations
  const createCity = trpc.admin.createCity.useMutation({
    onSuccess: () => { utils.admin.listCities.invalidate(); toast.success("تم إنشاء المدينة بنجاح"); setCityDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateCity = trpc.admin.updateCity.useMutation({
    onSuccess: () => { utils.admin.listCities.invalidate(); toast.success("تم تحديث المدينة بنجاح"); setCityDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const toggleCity = trpc.admin.toggleCityActive.useMutation({
    onSuccess: () => { utils.admin.listCities.invalidate(); utils.admin.listDistricts.invalidate(); toast.success("تم تحديث الحالة"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCity = trpc.admin.deleteCity.useMutation({
    onSuccess: () => { utils.admin.listCities.invalidate(); utils.admin.listDistricts.invalidate(); toast.success("تم حذف المدينة"); setDeleteConfirmOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const createDistrict = trpc.admin.createDistrict.useMutation({
    onSuccess: () => { utils.admin.listDistricts.invalidate(); toast.success("تم إنشاء الحي بنجاح"); setDistrictDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateDistrict = trpc.admin.updateDistrict.useMutation({
    onSuccess: () => { utils.admin.listDistricts.invalidate(); toast.success("تم تحديث الحي بنجاح"); setDistrictDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const toggleDistrict = trpc.admin.toggleDistrictActive.useMutation({
    onSuccess: () => { utils.admin.listDistricts.invalidate(); toast.success("تم تحديث الحالة"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteDistrict = trpc.admin.deleteDistrict.useMutation({
    onSuccess: () => { utils.admin.listDistricts.invalidate(); toast.success("تم حذف الحي"); setDeleteConfirmOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  // Filtered cities
  const filteredCities = citiesList.filter(c =>
    c.nameAr.includes(search) || (c.nameEn && c.nameEn.toLowerCase().includes(search.toLowerCase()))
  );

  // Handlers
  const openCreateCity = () => {
    setEditingCity(null);
    setCityForm({ nameAr: "", nameEn: "", sortOrder: 0 });
    setCityDialogOpen(true);
  };
  const openEditCity = (city: any) => {
    setEditingCity(city);
    setCityForm({ nameAr: city.nameAr, nameEn: city.nameEn || "", sortOrder: city.sortOrder || 0 });
    setCityDialogOpen(true);
  };
  const submitCity = () => {
    if (!cityForm.nameAr.trim()) { toast.error("أدخل اسم المدينة بالعربية"); return; }
    if (editingCity) {
      updateCity.mutate({ id: editingCity.id, ...cityForm });
    } else {
      createCity.mutate(cityForm);
    }
  };

  const openCreateDistrict = (cityId: number) => {
    setEditingDistrict(null);
    setSelectedCityForDistrict(cityId);
    setDistrictForm({ nameAr: "", nameEn: "", sortOrder: 0 });
    setDistrictDialogOpen(true);
  };
  const openEditDistrict = (district: any) => {
    setEditingDistrict(district);
    setSelectedCityForDistrict(district.cityId);
    setDistrictForm({ nameAr: district.nameAr, nameEn: district.nameEn || "", sortOrder: district.sortOrder || 0 });
    setDistrictDialogOpen(true);
  };
  const submitDistrict = () => {
    if (!districtForm.nameAr.trim()) { toast.error("أدخل اسم الحي بالعربية"); return; }
    if (!selectedCityForDistrict) return;
    if (editingDistrict) {
      updateDistrict.mutate({ id: editingDistrict.id, cityId: selectedCityForDistrict, ...districtForm });
    } else {
      createDistrict.mutate({ cityId: selectedCityForDistrict, ...districtForm });
    }
  };

  const confirmDelete = (type: "city" | "district", id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteConfirmOpen(true);
  };
  const executeDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "city") deleteCity.mutate({ id: deleteTarget.id });
    else deleteDistrict.mutate({ id: deleteTarget.id });
  };

  const getDistrictsForCity = (cityId: number) => districtsList.filter(d => d.cityId === cityId);

  const totalActive = citiesList.filter(c => c.isActive).length;
  const totalInactive = citiesList.filter(c => !c.isActive).length;
  const totalDistricts = districtsList.length;
  const totalActiveDistricts = districtsList.filter(d => d.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المدن والأحياء</h1>
          <p className="text-muted-foreground mt-1">إدارة المدن والأحياء السكنية المتاحة في الموقع</p>
        </div>
        <Button onClick={openCreateCity} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مدينة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{citiesList.length}</div>
            <div className="text-sm text-muted-foreground">إجمالي المدن</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalActive}</div>
            <div className="text-sm text-muted-foreground">مدن مفعلة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalDistricts}</div>
            <div className="text-sm text-muted-foreground">إجمالي الأحياء</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalActiveDistricts}</div>
            <div className="text-sm text-muted-foreground">أحياء مفعلة</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن مدينة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Cities List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : filteredCities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">لا توجد مدن بعد</p>
            <p className="mt-1">ابدأ بإضافة المدن التي تعمل بها</p>
            <Button onClick={openCreateCity} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              إضافة مدينة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCities.map((city) => {
            const cityDistricts = getDistrictsForCity(city.id);
            const isExpanded = expandedCity === city.id;
            return (
              <Card key={city.id} className={!city.isActive ? "opacity-60" : ""}>
                <CardContent className="p-0">
                  {/* City Row */}
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => setExpandedCity(isExpanded ? null : city.id)}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MapPin className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-base">{city.nameAr}</div>
                        {city.nameEn && <div className="text-sm text-muted-foreground">{city.nameEn}</div>}
                      </div>
                    </div>

                    <Badge variant={city.isActive ? "default" : "secondary"} className="shrink-0">
                      {city.isActive ? "مفعل" : "معطل"}
                    </Badge>

                    <Badge variant="outline" className="shrink-0">
                      {cityDistricts.length} حي
                    </Badge>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={city.isActive}
                        onCheckedChange={(checked) => toggleCity.mutate({ id: city.id, isActive: checked })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditCity(city)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirmDelete("city", city.id, city.nameAr)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Districts */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-sm text-muted-foreground">الأحياء في {city.nameAr}</h3>
                        <Button variant="outline" size="sm" onClick={() => openCreateDistrict(city.id)} className="gap-1">
                          <Plus className="h-3 w-3" />
                          إضافة حي
                        </Button>
                      </div>

                      {cityDistricts.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          لا توجد أحياء مضافة لهذه المدينة
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {cityDistricts.map((district) => (
                            <div
                              key={district.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border bg-background ${!district.isActive ? "opacity-50" : ""}`}
                            >
                              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{district.nameAr}</span>
                                {district.nameEn && <span className="text-sm text-muted-foreground mr-2">({district.nameEn})</span>}
                              </div>
                              <Badge variant={district.isActive ? "default" : "secondary"} className="text-xs shrink-0">
                                {district.isActive ? "مفعل" : "معطل"}
                              </Badge>
                              <div className="flex items-center gap-1 shrink-0">
                                <Switch
                                  checked={district.isActive}
                                  onCheckedChange={(checked) => toggleDistrict.mutate({ id: district.id, isActive: checked })}
                                />
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDistrict(district)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete("district", district.id, district.nameAr)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* City Dialog */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCity ? "تعديل المدينة" : "إضافة مدينة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">اسم المدينة بالعربية *</label>
              <Input
                value={cityForm.nameAr}
                onChange={(e) => setCityForm(f => ({ ...f, nameAr: e.target.value }))}
                placeholder="مثال: الرياض"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">اسم المدينة بالإنجليزية</label>
              <Input
                value={cityForm.nameEn}
                onChange={(e) => setCityForm(f => ({ ...f, nameEn: e.target.value }))}
                placeholder="e.g. Riyadh"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">ترتيب العرض</label>
              <Input
                type="number"
                value={cityForm.sortOrder}
                onChange={(e) => setCityForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCityDialogOpen(false)}>إلغاء</Button>
            <Button onClick={submitCity} disabled={createCity.isPending || updateCity.isPending}>
              {createCity.isPending || updateCity.isPending ? "جاري الحفظ..." : editingCity ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* District Dialog */}
      <Dialog open={districtDialogOpen} onOpenChange={setDistrictDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingDistrict ? "تعديل الحي" : "إضافة حي جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">اسم الحي بالعربية *</label>
              <Input
                value={districtForm.nameAr}
                onChange={(e) => setDistrictForm(f => ({ ...f, nameAr: e.target.value }))}
                placeholder="مثال: حي النرجس"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">اسم الحي بالإنجليزية</label>
              <Input
                value={districtForm.nameEn}
                onChange={(e) => setDistrictForm(f => ({ ...f, nameEn: e.target.value }))}
                placeholder="e.g. Al Narjis"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">ترتيب العرض</label>
              <Input
                type="number"
                value={districtForm.sortOrder}
                onChange={(e) => setDistrictForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistrictDialogOpen(false)}>إلغاء</Button>
            <Button onClick={submitDistrict} disabled={createDistrict.isPending || updateDistrict.isPending}>
              {createDistrict.isPending || updateDistrict.isPending ? "جاري الحفظ..." : editingDistrict ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {deleteTarget?.type === "city"
              ? `هل أنت متأكد من حذف مدينة "${deleteTarget?.name}"؟ سيتم حذف جميع الأحياء التابعة لها.`
              : `هل أنت متأكد من حذف حي "${deleteTarget?.name}"؟`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={executeDelete} disabled={deleteCity.isPending || deleteDistrict.isPending}>
              {deleteCity.isPending || deleteDistrict.isPending ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
