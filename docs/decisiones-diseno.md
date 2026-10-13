# Decisiones de Diseño

El presente documento intenta detallar las decisiones de diseño que se trabajaron en el repositorio para el backend.

## Diagnostico

1. Sobre el codigo analizado se detecto que en el flujo de registro se crea dos jerarquias de entidades totalmente distintas segun el rol del usuario (Cliente o Profesional) que ocasionaba que en la clase AuthService este presente un condicional: if (dto.isPro) donde conoce detalles de la instancia del perfil de profesional, lo que viola el principio de OCP (Principio Open/Close de Solid).
2. Ademas se detecto un objeto muy complejo que es el de perfil de profesional(ProfessionalProfileModel) con mas de 18 atributos que ocasiona instanciaciones gigantescas y de dificil mantenibilidad o escalabilidad futura, por lo que se decide implementar el patron creacional Builder para permitir la construccion paso a paso y simplificar la creacion de los objetos de este tipo y centralizar el proceso de creacion.

Dado el tamaño del proyecto y el objetivo MVP contemplado no se necesita de los patrones de comportamiento, estructurales o el creacional Singleton vistos en la catedra ya que su implementacion complejizaria el proyecto sin entregar valor agregado.

## Alternativas

La alternativa seria no implementar el Factory y dejar solo el Builder, pero romperia con un principio basico del SOLID. Entendemos dada la complejidad del objeto de perfil de profesional es altamente critico la implementacion del Builder, salvo que desglosemos la clase Profesional en clases interelacionadas, pero aumentariamos la interdependencia de clase y el acoplamiento.

## Decisión

Implementar Factory y Builder segun lo aclarado en el Diagnostico.

## Evidencia

### Factory

```typescript
// common/factories/AccountFactory.ts
export interface ICreatedAccount {
  user: UserModel;
  profile?: ProfessionalProfileModel;
}

export abstract class AccountCreator {
  public abstract createAccount(dto: RegisterDTO, passwordHash: string): Promise<ICreatedAccount>;
}

export class ClientAccountCreator extends AccountCreator {
  public async createAccount(dto: RegisterDTO, passwordHash: string): Promise<ICreatedAccount> {
    const user = await UserModel.create({ /* ...datos cliente */ role: 'CLIENT' });
    return { user };
  }
}

export class ProfessionalAccountCreator extends AccountCreator {
  public async createAccount(dto: RegisterDTO, passwordHash: string): Promise<ICreatedAccount> {
    const user = await UserModel.create({ /* ...datos usuario */ role: 'PROFESSIONAL' });
    const profile = await ProfessionalProfileModel.create({
      userId: user.id,
      tradeCategory: dto.tradeCategory || 'otro',
      isVerified: false,
      badgeLevel: 'Nuevo Profesional'
    });
    return { user, profile };
  }
}
```

**Beneficios SOLID:**
- **SRP (Single Responsibility)**: `AuthService` solo maneja la orquestación y generación de JWT; delega la creación a la fábrica.
- **OCP (Open/Closed)**: Si mañana agregás un rol `ENTERPRISE` o `COMPANY_CONTRACTOR`, creás una nueva subclase sin modificar `AuthService`.

### Builder

```typescript
// modules/professionals/builders/ProfessionalProfileBuilder.ts
export class ProfessionalProfileBuilder {
  private profileData: Partial<IProfessionalProfileAttributes> = {
    coverageRadiusKm: 15,
    basePrice: 10000,
    responseTime: '< 30 min',
    isEmergencyAvailable: false,
    isVerified: false,
    ratingAverage: 5.0,
    totalReviews: 0,
    specialties: []
  };

  constructor(userId: string) {
    this.profileData.userId = userId;
  }

  public withTrade(category: string, headline: string, licenseNumber: string): this {
    this.profileData.tradeCategory = category;
    this.profileData.headline = headline;
    this.profileData.licenseNumber = licenseNumber;
    return this;
  }

  public withLocation(city: string, zone: string, address: string, radiusKm = 20): this {
    this.profileData.city = city;
    this.profileData.zone = zone;
    this.profileData.address = address;
    this.profileData.coverageRadiusKm = radiusKm;
    return this;
  }

  public withEmergencyAvailability(responseTime = '< 20 min'): this {
    this.profileData.isEmergencyAvailable = true;
    this.profileData.responseTime = responseTime;
    return this;
  }

  public withReputation(rating: number, totalReviews: number, badge = 'Verificado Fixer'): this {
    this.profileData.ratingAverage = rating;
    this.profileData.totalReviews = totalReviews;
    this.profileData.badgeLevel = badge;
    this.profileData.isVerified = true;
    return this;
  }

  public async build(): Promise<ProfessionalProfileModel> {
    return ProfessionalProfileModel.create(this.profileData as any);
  }
}
```

**Uso práctico (en Seeders, Tests o Servicios):**
```typescript
// Construcción fluida y auto-documentada de Carlos Mendoza
const carlosProfile = await new ProfessionalProfileBuilder(carlosUserId)
  .withTrade('plomeria', 'Plomería Integral & Gasista de 1ª', 'Matrícula Nº 48.912')
  .withLocation('Bahía Blanca', 'Palermo y Zona Norte', 'San Martín 228', 25)
  .withReputation(4.9, 142, 'Fixer Diamond')
  .withEmergencyAvailability('< 20 min')
  .build();
```

| Patrón | ¿Aplica? | Punto de aplicación en Fixer | Beneficio principal |
| :--- | :---: | :--- | :--- |
| **Factory** | **Sí** | Registro de cuentas (`Client` vs `Professional`) y Solicitudes (`Urgent` vs `Standard`) | Desacopla `AuthService` de la instanciación de perfiles (SRP / OCP). |
| **Builder** | **Sí** | Creación de `ProfessionalProfileModel` y armado de consultas en `ProfessionalRepository` | Elimina constructores gigantes con 18 parámetros y permite tests/seeders limpios y fluidos. |
