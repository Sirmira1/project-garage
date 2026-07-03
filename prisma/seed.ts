import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@garage.dev";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/900/560`;
}

async function main() {
  console.log("Seeding…");

  // Clean slate for the demo user
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash("garage123", 10);
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Demo Driver",
      passwordHash,
    },
  });

  await prisma.budget.create({
    data: { userId: user.id, year: new Date().getFullYear(), amount: 6000 },
  });

  // -------------------------------------------------------------------------
  // Vehicle 1 — Mk7 GTI
  // -------------------------------------------------------------------------
  const gti = await prisma.vehicle.create({
    data: {
      userId: user.id,
      name: "Project GTI",
      nickname: "Wolfsburg",
      year: 2016,
      make: "Volkswagen",
      model: "Golf GTI",
      trim: "Autobahn",
      generation: "Mk7",
      vin: "WVWXX000000000001",
      engine: "2.0T EA888 Gen3",
      transmission: "6-speed manual",
      drivetrain: "FWD",
      stockHp: 210,
      currentHp: 292,
      targetHp: 320,
      stockTorque: 258,
      currentTorque: 350,
      factoryWeight: 3100,
      currentWeight: 3040,
      purchasePrice: 24500,
      purchaseDate: daysAgo(720),
      currentMileage: 58200,
      color: "Tornado Red",
      coverImage: img("gti-red"),
    },
  });

  const gtiMods = [
    { name: "APR Stage 2 Tune", category: "ENGINE", area: "ENGINE_BAY", brand: "APR", cost: 900, status: "INSTALLED", installDate: daysAgo(540), partNumber: "T2A-EA888-93" },
    { name: "Cold Air Intake", category: "INTAKE", area: "ENGINE_BAY", brand: "Integrated Engineering", cost: 415, status: "INSTALLED", installDate: daysAgo(560) },
    { name: "Catback Exhaust", category: "EXHAUST", area: "REAR", brand: "AWE Track Edition", cost: 1295, status: "INSTALLED", installDate: daysAgo(500) },
    { name: "Turbo Inlet Elbow", category: "TURBO", area: "ENGINE_BAY", brand: "IE", cost: 180, status: "INSTALLED", installDate: daysAgo(480) },
    { name: "Coilovers", category: "SUSPENSION", area: "UNDERBODY", brand: "Bilstein B16", cost: 1650, status: "INSTALLED", installDate: daysAgo(300) },
    { name: "18x9.5 Wheels", category: "WHEELS", area: "SIDE", brand: "Enkei RPF1", cost: 1200, status: "INSTALLED", installDate: daysAgo(280) },
    { name: "Michelin PS4S", category: "TIRES", area: "SIDE", brand: "Michelin", cost: 980, status: "INSTALLED", installDate: daysAgo(280) },
    { name: "Big Brake Kit", category: "BRAKES", area: "FRONT", brand: "Brembo GT", cost: 2400, status: "ORDERED" },
    { name: "Front Lip", category: "AERO", area: "FRONT", brand: "Maxton Design", cost: 320, status: "INSTALLED", installDate: daysAgo(210) },
    { name: "Intercooler", category: "COOLING", area: "FRONT", brand: "Wagner Tuning", cost: 650, status: "PLANNED" },
    { name: "Short Shifter", category: "INTERIOR", area: "INTERIOR", brand: "CTS Turbo", cost: 210, status: "INSTALLED", installDate: daysAgo(190) },
    { name: "LED Headlights", category: "LIGHTING", area: "FRONT", brand: "OSRAM", cost: 260, status: "WISHLIST" },
    { name: "Stage 3 IS38 Turbo", category: "TURBO", area: "ENGINE_BAY", brand: "IS38", cost: 1800, status: "WISHLIST" },
  ] as const;

  for (const m of gtiMods) {
    await prisma.modification.create({
      data: {
        vehicleId: gti.id,
        name: m.name,
        category: m.category,
        area: m.area,
        brand: m.brand,
        cost: m.cost,
        status: m.status,
        installDate: "installDate" in m ? m.installDate : null,
        partNumber: "partNumber" in m ? m.partNumber : null,
      },
    });
  }

  await prisma.fitmentRecord.create({
    data: {
      vehicleId: gti.id,
      label: "Track setup",
      wheelWidth: 9.5,
      wheelDiameter: 18,
      offset: 38,
      tireSize: "255/35R18",
      current: true,
    },
  });

  await prisma.serviceRecord.createMany({
    data: [
      { vehicleId: gti.id, name: "Full synthetic oil change", type: "OIL_CHANGE", date: daysAgo(60), mileage: 57800, cost: 95, intervalMiles: 5000, nextDueMileage: 62800, nextDueDate: daysFromNow(40) },
      { vehicleId: gti.id, name: "DSG/Manual fluid", type: "FLUIDS", date: daysAgo(200), mileage: 54000, cost: 180 },
      { vehicleId: gti.id, name: "Brake fluid flush", type: "BRAKES", date: daysAgo(120), mileage: 56000, cost: 120 },
      { vehicleId: gti.id, name: "State inspection", type: "INSPECTION", date: daysAgo(30), mileage: 58000, cost: 40, nextDueDate: daysFromNow(335) },
    ],
  });

  await prisma.goal.createMany({
    data: [
      { vehicleId: gti.id, title: "320 whp", description: "Hybrid turbo + supporting mods", targetValue: 320, currentValue: 292, unit: "hp", progress: 74, status: "ACTIVE" },
      { vehicleId: gti.id, title: "Track day ready", description: "BBK, pads, fluid, cooling", progress: 60, status: "ACTIVE" },
      { vehicleId: gti.id, title: "Exterior refresh", description: "Lip kit + wheels", progress: 100, status: "ACHIEVED" },
    ],
  });

  await prisma.timelineEvent.createMany({
    data: [
      { vehicleId: gti.id, type: "MILESTONE", title: "Picked up the GTI", date: daysAgo(720), description: "Bone stock, 42k miles." },
      { vehicleId: gti.id, type: "MOD_INSTALLED", title: "Stage 2 tune + intake", date: daysAgo(540), cost: 1315, imageUrl: img("gti-dyno") },
      { vehicleId: gti.id, type: "DYNO", title: "Dyno: 292 whp / 350 tq", date: daysAgo(300), description: "Best pull on 93 octane." },
      { vehicleId: gti.id, type: "MOD_INSTALLED", title: "Coilovers + wheels", date: daysAgo(280), cost: 3830, imageUrl: img("gti-wheels") },
      { vehicleId: gti.id, type: "MILESTONE", title: "First track day", date: daysAgo(150), description: "1:52 at the local circuit." },
    ],
  });

  await prisma.dynoRecord.createMany({
    data: [
      { vehicleId: gti.id, date: daysAgo(560), hp: 210, torque: 258 },
      { vehicleId: gti.id, date: daysAgo(300), hp: 292, torque: 350, quarterMile: 13.4, zeroToSixty: 5.1 },
    ],
  });

  await prisma.shoppingItem.createMany({
    data: [
      { vehicleId: gti.id, name: "IS38 Hybrid Turbo", estimatedCost: 1800, priority: "HIGH", status: "RESEARCHING", vendorUrl: "https://example.com/is38", availability: "In stock" },
      { vehicleId: gti.id, name: "Wagner Intercooler", estimatedCost: 650, priority: "MEDIUM", status: "READY_TO_BUY", vendorUrl: "https://example.com/wagner" },
      { vehicleId: gti.id, name: "Brembo BBK", estimatedCost: 2400, priority: "HIGH", status: "ORDERED" },
      { vehicleId: gti.id, name: "Maxton Front Lip", estimatedCost: 320, priority: "LOW", status: "INSTALLED" },
      { vehicleId: gti.id, name: "OSRAM LED Headlights", estimatedCost: 260, priority: "LOW", status: "RESEARCHING", availability: "Backorder" },
    ],
  });

  await prisma.photo.createMany({
    data: [
      { vehicleId: gti.id, url: img("gti-1"), caption: "Fresh wash", sortOrder: 0 },
      { vehicleId: gti.id, url: img("gti-2"), caption: "New wheels", sortOrder: 1 },
      { vehicleId: gti.id, url: img("gti-3"), caption: "Track day", sortOrder: 2 },
      { vehicleId: gti.id, url: img("gti-4"), caption: "Engine bay", sortOrder: 3 },
      { vehicleId: gti.id, url: img("gti-5"), caption: "Dyno pull", sortOrder: 4 },
      { vehicleId: gti.id, url: img("gti-6"), caption: "Rear 3/4", sortOrder: 5 },
    ],
  });

  await prisma.document.createMany({
    data: [
      { vehicleId: gti.id, name: "Dyno sheet - 292whp.pdf", type: "DYNO_SHEET", url: "#" },
      { vehicleId: gti.id, name: "AWE exhaust invoice.pdf", type: "INVOICE", url: "#" },
      { vehicleId: gti.id, name: "Alignment - track spec.pdf", type: "ALIGNMENT_SHEET", url: "#" },
      { vehicleId: gti.id, name: "Owners manual.pdf", type: "MANUAL", url: "#" },
    ],
  });

  await prisma.note.create({
    data: {
      vehicleId: gti.id,
      title: "Build notes",
      content:
        "## To-do\n- [ ] Order IS38\n- [x] Fresh alignment\n- [ ] New pads before next track day\n\nRunning great on 93 octane.",
    },
  });

  // -------------------------------------------------------------------------
  // Vehicle 2 — NA Miata
  // -------------------------------------------------------------------------
  const miata = await prisma.vehicle.create({
    data: {
      userId: user.id,
      name: "Weekend Miata",
      nickname: "Roadster",
      year: 1994,
      make: "Mazda",
      model: "MX-5 Miata",
      trim: "Base",
      generation: "NA",
      engine: "1.8L BP",
      transmission: "5-speed manual",
      drivetrain: "RWD",
      stockHp: 128,
      currentHp: 135,
      targetHp: 200,
      factoryWeight: 2293,
      currentWeight: 2180,
      purchasePrice: 7500,
      purchaseDate: daysAgo(400),
      currentMileage: 121000,
      color: "Classic Red",
      coverImage: img("miata-red"),
    },
  });

  const miataMods = [
    { name: "Header", category: "EXHAUST", area: "ENGINE_BAY", brand: "Racing Beat", cost: 340, status: "INSTALLED", installDate: daysAgo(200) },
    { name: "Coilovers", category: "SUSPENSION", area: "UNDERBODY", brand: "BC Racing", cost: 1000, status: "INSTALLED", installDate: daysAgo(150) },
    { name: "Hardtop", category: "EXTERIOR", area: "REAR", brand: "OEM", cost: 800, status: "INSTALLED", installDate: daysAgo(120) },
    { name: "Turbo Kit", category: "TURBO", area: "ENGINE_BAY", brand: "FM II", cost: 3500, status: "WISHLIST" },
    { name: "Roll Bar", category: "INTERIOR", area: "INTERIOR", brand: "Blackbird Fabworx", cost: 650, status: "PLANNED" },
  ] as const;

  for (const m of miataMods) {
    await prisma.modification.create({
      data: {
        vehicleId: miata.id,
        name: m.name,
        category: m.category,
        area: m.area,
        brand: m.brand,
        cost: m.cost,
        status: m.status,
        installDate: "installDate" in m ? m.installDate : null,
      },
    });
  }

  await prisma.fitmentRecord.create({
    data: {
      vehicleId: miata.id,
      label: "Autocross",
      wheelWidth: 8,
      wheelDiameter: 15,
      offset: 20,
      tireSize: "205/50R15",
      current: true,
    },
  });

  await prisma.serviceRecord.createMany({
    data: [
      { vehicleId: miata.id, name: "Timing belt + water pump", type: "BELT", date: daysAgo(180), mileage: 118000, cost: 600 },
      { vehicleId: miata.id, name: "Oil change", type: "OIL_CHANGE", date: daysAgo(45), mileage: 120500, cost: 60, nextDueMileage: 124000 },
    ],
  });

  await prisma.goal.create({
    data: {
      vehicleId: miata.id,
      title: "200 whp turbo build",
      targetValue: 200,
      currentValue: 135,
      unit: "hp",
      progress: 30,
      status: "ACTIVE",
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      { vehicleId: miata.id, type: "MILESTONE", title: "Bought the roadster", date: daysAgo(400) },
      { vehicleId: miata.id, type: "MOD_INSTALLED", title: "Coilovers installed", date: daysAgo(150), cost: 1000 },
    ],
  });

  await prisma.photo.createMany({
    data: [
      { vehicleId: miata.id, url: img("miata-1"), caption: "Canyon run", sortOrder: 0 },
      { vehicleId: miata.id, url: img("miata-2"), caption: "Top down", sortOrder: 1 },
      { vehicleId: miata.id, url: img("miata-3"), caption: "Autocross", sortOrder: 2 },
    ],
  });

  console.log(`Seeded user ${user.email} with 2 vehicles.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
