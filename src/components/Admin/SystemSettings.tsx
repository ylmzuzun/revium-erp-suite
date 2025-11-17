import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Database, Bell, Mail, Lock, Activity } from "lucide-react";

export const SystemSettings = () => {
  const handleSave = () => {
    toast.success("Ayarlar kaydedildi");
  };

  return (
    <div className="space-y-6">
      {/* Genel Ayarlar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Genel Ayarlar
          </CardTitle>
          <CardDescription>
            Sistem genelindeki temel yapılandırmalar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bakım Modu</Label>
              <p className="text-sm text-muted-foreground">
                Sistemi geçici olarak devre dışı bırak
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Yeni Kayıtlar</Label>
              <p className="text-sm text-muted-foreground">
                Yeni kullanıcı kayıtlarına izin ver
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Şirket Adı</Label>
            <Input defaultValue="Revium" />
          </div>
          <div className="space-y-2">
            <Label>Destek Email</Label>
            <Input type="email" defaultValue="destek@revium.com" />
          </div>
        </CardContent>
      </Card>

      {/* Bildirim Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirim Ayarları
          </CardTitle>
          <CardDescription>
            Sistem bildirimleri ve uyarı yapılandırması
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Önemli olaylarda email gönder
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Görev Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Yeni görev atandığında bildir
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Üretim Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Üretim durumu değişikliklerinde bildir
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Güvenlik Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Güvenlik Ayarları
          </CardTitle>
          <CardDescription>
            Kimlik doğrulama ve güvenlik yapılandırması
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>İki Faktörlü Doğrulama</Label>
              <p className="text-sm text-muted-foreground">
                Tüm kullanıcılar için zorunlu kıl
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Şifre Süresi</Label>
              <p className="text-sm text-muted-foreground">
                Şifrelerin düzenli olarak değiştirilmesini zorunlu kıl
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Oturum Süresi (dakika)</Label>
            <Input type="number" defaultValue="480" />
          </div>
          <div className="space-y-2">
            <Label>Minimum Şifre Uzunluğu</Label>
            <Input type="number" defaultValue="8" />
          </div>
        </CardContent>
      </Card>

      {/* Veritabanı Yönetimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Veritabanı Yönetimi
          </CardTitle>
          <CardDescription>
            Veri yedekleme ve bakım işlemleri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Otomatik Yedekleme</Label>
              <p className="text-sm text-muted-foreground">
                Günlük otomatik yedekleme yap
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Yedek Al
            </Button>
            <Button variant="outline" className="flex-1">
              Geri Yükle
            </Button>
          </div>
          <Button variant="destructive" className="w-full">
            Veritabanını Temizle
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>
          Tüm Ayarları Kaydet
        </Button>
      </div>
    </div>
  );
};
