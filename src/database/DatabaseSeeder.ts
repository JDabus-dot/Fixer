import { UserModel } from '../modules/users/models/UserModel.js';
import { ProfessionalProfileModel } from '../modules/professionals/models/ProfessionalProfileModel.js';
import { ReviewModel } from '../modules/reviews/models/ReviewModel.js';
import { ServiceRequestModel } from '../modules/service-requests/models/ServiceRequestModel.js';
import { PasswordHasher } from '../common/utils/PasswordHasher.js';
import { ProfessionalProfileBuilder } from '../modules/professionals/builders/ProfessionalProfileBuilder.js';

/**
 * Seeder POO para poblar la base de datos con datos realistas basados en los maquetados.
 */
export class DatabaseSeeder {
  private readonly passwordHasher: PasswordHasher;

  constructor(passwordHasher = new PasswordHasher()) {
    this.passwordHasher = passwordHasher;
  }

  public async seed(): Promise<void> {
    const existingProfiles = await ProfessionalProfileModel.count();
    if (existingProfiles > 0) {
      console.log('ℹ️ Base de datos ya cuenta con profesionales. Se omite el seeding.');
      return;
    }

    console.log('🌱 Ejecutando seeders de datos iniciales Fixer Marketplace...');

    // Si existen usuarios huérfanos sin perfil por un fallo previo, limpiar para resembrar limpiamente
    await ReviewModel.destroy({ where: {} });
    await ServiceRequestModel.destroy({ where: {} });
    await ProfessionalProfileModel.destroy({ where: {} });
    await UserModel.destroy({ where: {} });

    const defaultPasswordHash = await this.passwordHasher.hash('Password123!');

    // 1. Crear Profesional Principal: Carlos Mendoza (del maquetado)
    const carlosUser = await UserModel.create({
      fullName: 'Carlos Mendoza',
      email: 'carlos.mendoza@fixerservices.com',
      phone: '+54 9 11 4455-8899',
      passwordHash: defaultPasswordHash,
      role: 'PROFESSIONAL',
      securityQuestion: '¿Cuál fue el nombre de tu primer taller o maestro de oficio?',
      securityAnswerHash: await this.passwordHasher.hash('Taller Don Anselmo'),
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBXUPC99B3fkkAqetTUJgjpnlYX-DTL4JDuvXjeQm2iImcGIXb2J5kRi0OL34IN6uZ4AaqOM3kayhHTL4ZFCSBBno6kThWmscTyXBQ8OYSk4rBlElaSGFwK7G4QHZQbLJD4xhsCHTOHFHnlxPxv4eAUDJoO7M6z4UyiRcH5Cos6YMqij9SW9OPR7VKlQwBIseDp2iEN5kprmTTXF9HcC9sasH42Ss2DHDtAp36LkjSaJayFj03vfg-Owg',
      termsAccepted: true,
      isActive: true
    });

    const carlosUserId = carlosUser.id || (carlosUser as any).getDataValue('id');

    // Construcción fluida y consistente mediante el Patrón BUILDER
    const carlosProfile = await new ProfessionalProfileBuilder(carlosUserId)
      .withTrade(
        'plomeria',
        'Plomería Integral & Gasista Matriculado de 1ª Categoría',
        'Matrícula Metrogas Nº 48.912',
        14
      )
      .withBio(
        'Técnico instalador matriculado con más de 14 años de oficio en obras residenciales, remodelaciones de categoría y consorcios en CABA y Zona Norte. Me especializo en intervenciones no invasivas de máxima precisión, empleando instrumental de detección acústica y termografía infrarroja para diagnosticar fallas sin roturas innecesarias. Cuento con instrumental homologado y compromiso estricto de puntualidad y limpieza en cada trabajo.'
      )
      .withLocation('Bahía Blanca', 'Palermo y Zona Norte', 'San Martín 228, Bahía Blanca', 25)
      .withEmergencyAvailability('< 20 min')
      .withReputation(4.9, 142, 'Fixer Diamond', 121, 17, 3, 1, 0)
      .withSpecialties([
        'Detección térmica de pérdidas',
        'Termofusión y soldadura sanitaria',
        'Service integral de calderas duales',
        'Instalación de artefactos y griferías',
        'Planos de gas y habilitación oficial'
      ])
      .build();

    // 2. Crear Clientes para reseñas y solicitudes
    const javierUser = await UserModel.create({
      fullName: 'Javier Rossi',
      email: 'javier.rossi@ejemplo.com',
      phone: '+54 9 11 2233-4455',
      passwordHash: defaultPasswordHash,
      role: 'CLIENT',
      securityQuestion: 'mascota',
      securityAnswerHash: await this.passwordHasher.hash('Firulais'),
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDwD-OBsteyhebVsTT_jAMCVCRVFL26Y9DcayQVTd6rPVa8TH-JtJLQpst4usoJ3Q3T2uRINKHkb62GKiDk3ESvdNOzKodB_r2DrXv_McQC_0HBD386DeWHURoumQBJpxmXSqxp81sD5ngtKhOerEB1pUSCzZfbzSzs8PGbba_88SUek1CioTPdlqGEeOIByOnbnSqiJyEUaBG2NO3kg5XmWqfqQeKx50WYUKcJiHG_iF0GCaesS_AY9A',
      termsAccepted: true,
      isActive: true
    });

    const florenciaUser = await UserModel.create({
      fullName: 'Florencia Benítez',
      email: 'florencia.benitez@ejemplo.com',
      phone: '+54 9 11 3344-5566',
      passwordHash: defaultPasswordHash,
      role: 'CLIENT',
      securityQuestion: 'ciudad',
      securityAnswerHash: await this.passwordHasher.hash('Rosario'),
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAx8TnW64PU0nQw5p3lL2sSdrkXmbM-HwJtXmrc39-3elWpma82YGg-mLjCF-wwV7RsMMbMhH_xdq8KHLjYQywyCvMRzUo-2jDJKRHHpsMvk46Lua3iXoEfFaC9v1CBiSAAFfxt2IhmOGwz5s3CqwDGdE1t9TgGkKLGQxZE-cA_G1UOIXuXSAdxAuqUp9KyyUrx4Wq3ExTwrvTqyBH8mghf-uqfz4R0Uo29kgnbXz3J-PILsIIcPD_2Cg',
      termsAccepted: true,
      isActive: true
    });

    const gonzaloUser = await UserModel.create({
      fullName: 'Gonzalo Morales',
      email: 'gonzalo.morales@ejemplo.com',
      phone: '+54 9 11 9988-7766',
      passwordHash: defaultPasswordHash,
      role: 'CLIENT',
      securityQuestion: 'escuela',
      securityAnswerHash: await this.passwordHasher.hash('San Martin'),
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAycyWDnO7SDwmV7m96kqJdOS61xPXzg7GJqvC0TMRqFpD04AtJrX2w6IubgJhTlyWyjx-oy6giCwZ-I4zkaU6Cob3uz_X_0rW0SNXFMXpCS49Y1zuE7ViihiFh2qbCPI3HE8tU0PhMWOFK4f95tEin9BB650dawFCwiQZey3v9BKnPOB3gS820jedGnT5-LLyXKj5LZuFmdmHfGWXMpVuT0lTPnN5fsZ5ov_FmMM4K9q3Vs-v1fwgYdQ',
      termsAccepted: true,
      isActive: true
    });

    const demoClient = await UserModel.create({
      fullName: 'Martina Gómez',
      email: 'martina@ejemplo.com',
      phone: '+54 9 11 2345-6789',
      passwordHash: defaultPasswordHash,
      role: 'CLIENT',
      securityQuestion: 'mascota',
      securityAnswerHash: await this.passwordHasher.hash('Milo'),
      termsAccepted: true,
      isActive: true
    });

    // 3. Crear Reseñas Reales para Carlos Mendoza
    await ReviewModel.create({
      clientId: javierUser.id,
      professionalId: carlosProfile.id,
      rating: 5,
      serviceType: 'Detección térmica de pérdida',
      comment:
        'Teníamos una humedad persistente entre dos departamentos y otros presupuestos proponían levantar todo el piso. Carlos vino con la cámara térmica, detectó la fisura puntual en una T de termofusión y en 4 horas quedó solucionado. Impecable trabajo.',
      isVerifiedVisit: true,
      professionalReply: 'Muchas gracias Javier por confiar en el equipo y cuidar las instalaciones de tu hogar.'
    });

    await ReviewModel.create({
      clientId: florenciaUser.id,
      professionalId: carlosProfile.id,
      rating: 5,
      serviceType: 'Cambio de grifería y colector',
      comment:
        'Excelente profesional. Cumplió con los tiempos pactados y el presupuesto final coincidió al centavo con lo acordado a través de la plataforma Fixer. Muy recomendable.',
      isVerifiedVisit: true
    });

    await ReviewModel.create({
      clientId: gonzaloUser.id,
      professionalId: carlosProfile.id,
      rating: 5,
      serviceType: 'Service caldera dual',
      comment:
        'Hizo el mantenimiento anual de la caldera y purgó todos los radiadores de la casa. Muy detallista y nos dejó las recomendaciones de presión para el invierno. Gran servicio.',
      isVerifiedVisit: true
    });

    // 4. Crear Otros Profesionales para los resultados de búsqueda
    const robertoUser = await UserModel.create({
      fullName: 'Roberto Gómez',
      email: 'roberto.gomez@fixerservices.com',
      phone: '+54 9 11 5566-7788',
      passwordHash: defaultPasswordHash,
      role: 'PROFESSIONAL',
      securityQuestion: 'herramienta',
      securityAnswerHash: await this.passwordHasher.hash('Tester Fluke'),
      termsAccepted: true,
      isActive: true
    });

    await new ProfessionalProfileBuilder(robertoUser.id || (robertoUser as any).getDataValue('id'))
      .withTrade('electricidad', 'Electricista Matriculado COPIME & Automatizaciones', 'Matrícula COPIME Nº 29.841', 11)
      .withBio('Especialista en tableros eléctricos certificados, cableados ignífugos y detección de fugas a tierra.')
      .withLocation('CABA', 'Palermo y Belgrano', 'Av. Cabildo 1420', 20)
      .withEmergencyAvailability('< 15 min')
      .withReputation(4.8, 89, 'Fixer Pro', 75, 12, 2, 0, 0)
      .withSpecialties(['Tableros seccionales', 'Monofásica y Trifásica', 'Luces LED empotradas'])
      .build();

    const marianaUser = await UserModel.create({
      fullName: 'Mariana Vázquez',
      email: 'mariana.vazquez@fixerservices.com',
      phone: '+54 9 11 6677-8899',
      passwordHash: defaultPasswordHash,
      role: 'PROFESSIONAL',
      securityQuestion: 'mascota',
      securityAnswerHash: await this.passwordHasher.hash('Luna'),
      termsAccepted: true,
      isActive: true
    });

    await new ProfessionalProfileBuilder(marianaUser.id || (marianaUser as any).getDataValue('id'))
      .withTrade('pintura', 'Pintura de Obra, Interiores & Acabados de Alta Calidad', 'Certificación Profesional Fixer 2024', 8)
      .withBio('Pintura látex lavable, esmaltes sintéticos, enduido completo e impermeabilización de terrazas.')
      .withLocation('CABA', 'Recoleta y Caballito', 'Av. Santa Fe 3200', 15)
      .withResponseTime('< 45 min')
      .withReputation(4.9, 64, 'Fixer Verified', 58, 5, 1, 0, 0)
      .withSpecialties(['Pintura interior', 'Microcemento alisado', 'Impermeabilización'])
      .build();

    // 5. Crear Solicitud de Servicio de Ejemplo
    await ServiceRequestModel.create({
      clientId: demoClient.id,
      professionalId: carlosProfile.id,
      title: 'Reparación de válvula de descarga en baño principal',
      description: 'Pierde agua de forma constante y genera ruido por la noche. Se requiere cambio de fuelle o válvula completa.',
      category: 'plomeria',
      serviceAddress: 'Thames 2100, Palermo, CABA',
      zone: 'Palermo',
      isUrgent: true,
      scheduledDate: new Date(),
      status: 'PENDING'
    });

    console.log('✅ Seeding completado exitosamente.');
  }
}
