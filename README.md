# Next.js + Firebase + OOP/AOP/RBAC Projesi

Bu proje, Next.js ve Firebase kullanarak Nesne Yönelimli Programlama (OOP), Görünüş Odaklı Programlama (AOP) ve Rol Tabanlı Erişim Kontrolü (RBAC) prensiplerine uygun bir web uygulaması örneğidir.

## Özellikler

- **Next.js 14**: App Router, Server Components, React Server Components (RSC)
- **Firebase**: Authentication, Firestore, Storage
- **OOP Prensipleri**: Sınıflar, Inheritance, Encapsulation, Singleton Pattern
- **AOP Prensipleri**: TypeScript Dekoratörleri, Cross-Cutting Concerns, Method Interception
- **RBAC Prensipleri**: Rol tabanlı erişim kontrolü, İzin yönetimi

## Proje Yapısı

```
src/
├── app/                     # Next.js App Router
├── components/              # React bileşenleri
├── lib/
│   ├── aop/                 # AOP dekoratörleri ve middleware'ler
│   ├── auth/                # RBAC ve kimlik doğrulama işlemleri
│   ├── firebase/            # Firebase yapılandırması
│   └── services/            # Servis sınıfları
```

## Başlangıç

1. Bu repo'yu klonlayın
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Firebase projenizi oluşturun ve `.env.local.example` dosyasını `.env.local` olarak kopyalayıp Firebase projenize ait bilgileri girin:
   ```bash
   cp .env.local.example .env.local
   ```
4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın

## OOP Özellikleri

Bu projede şu OOP prensipleri kullanılmıştır:

- **Sınıflar**: Veri modellemesi için kullanıcı sınıfı
- **Encapsulation**: Private değişkenler ve metodlar
- **Inheritance**: Model sınıflarında miras alma
- **Singleton Pattern**: Servis sınıfları için tekil örnekleme

## AOP Özellikleri

Bu projede şu AOP prensipleri kullanılmıştır:

- **Dekoratörler**: Metot çağrılarını sarmak için
- **Cross-Cutting Concerns**: Loglama, önbellekleme, yetkilendirme
- **Method Interception**: Metot öncesi/sonrası işlemler

## RBAC Özellikleri

Bu projede şu RBAC prensipleri kullanılmıştır:

- **Roller**: Admin, Manager, User, Guest
- **İzinler**: Create, Read, Update, Delete
- **Yetkilendirme**: Dekoratörler ve middleware'ler ile

## Geliştirme

### Servis Eklemek

Yeni bir servis eklemek için `src/lib/services` klasörüne gidip yeni bir servis sınıfı oluşturun:

```typescript
import { Cache, Logger, RequirePermission } from '@/lib/aop/decorators';
import { Permission } from '@/lib/auth/rbac';

export class YeniServis {
  private static instance: YeniServis;
  
  private constructor() {}
  
  public static getInstance(): YeniServis {
    if (!YeniServis.instance) {
      YeniServis.instance = new YeniServis();
    }
    return YeniServis.instance;
  }
  
  @Cache()
  @Logger
  @RequirePermission(Permission.READ)
  public async ornekMetot() {
    // ...metot uygulaması
  }
}

export const yeniServis = YeniServis.getInstance();
```

## Lisans

MIT
