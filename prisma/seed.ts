import { PrismaClient, Role, OrderType, OrderStatus, PaymentMethod, PaymentStatus, TableStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";

const db = new PrismaClient();

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== "true") throw new Error("Set ALLOW_DEMO_SEED=true to run demo seed.");
  
  const email = "owner@example.com";
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  
  console.log("Seeding RestaurantOS with premium data and imagery...");

  // 1. Restaurant
  const restaurant = await db.restaurant.upsert({
    where: { slug: "spice-symphony" },
    update: {
      name: "Spice Symphony & Grand Bistro",
      currency: "INR",
      gstin: "27AABCS1429B1Z0",
      address: "Ground Floor, Cyber Hub, Galleria Avenue, Gurgaon, Haryana 122002"
    },
    create: {
      name: "Spice Symphony & Grand Bistro",
      slug: "spice-symphony",
      currency: "INR",
      gstin: "27AABCS1429B1Z0",
      address: "Ground Floor, Cyber Hub, Galleria Avenue, Gurgaon, Haryana 122002"
    }
  });

  // 2. Branch
  const branch = await db.branch.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Flagship Cyber Hub" } },
    update: { phone: "+91 98765 43210", address: "Cyber Hub, DLF Phase 2" },
    create: {
      restaurantId: restaurant.id,
      name: "Flagship Cyber Hub",
      phone: "+91 98765 43210",
      address: "Cyber Hub, DLF Phase 2"
    }
  });

  // 3. User
  await db.user.upsert({
    where: { email },
    update: { passwordHash, active: true, restaurantId: restaurant.id, branchId: branch.id },
    create: {
      restaurantId: restaurant.id,
      branchId: branch.id,
      name: "Chef Vikram Adiga (Executive Owner)",
      email,
      passwordHash,
      role: Role.OWNER
    }
  });

  // 4. Categories
  const categoriesData = [
    { name: "Starters & Tandoor", sortOrder: 1 },
    { name: "Main Course & Curries", sortOrder: 2 },
    { name: "Breads & Biryani", sortOrder: 3 },
    { name: "Artisan Pizza & Continental", sortOrder: 4 },
    { name: "Beverages & Mocktails", sortOrder: 5 },
    { name: "Desserts & Sweets", sortOrder: 6 }
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const c = await db.menuCategory.upsert({
      where: { branchId_name: { branchId: branch.id, name: cat.name } },
      update: { sortOrder: cat.sortOrder },
      create: { branchId: branch.id, name: cat.name, sortOrder: cat.sortOrder }
    });
    categoryMap.set(cat.name, c.id);
  }

  // 5. Products with images
  const products = [
    {
      name: "Tandoori Paneer Tikka",
      cat: "Starters & Tandoor",
      pricePaise: 34000,
      isVeg: true,
      description: "Char-grilled fresh cottage cheese marinated in hung curd, Kashmiri deghi mirch and mustard oil with mint coulis.",
      imageUrl: "/images/dishes/paneer-tikka.jpg"
    },
    {
      name: "Royal Chicken Tikka Skewers",
      cat: "Starters & Tandoor",
      pricePaise: 42000,
      isVeg: false,
      description: "Tender boneless chicken thigh infused with toasted tandoori spices, smoked cloves and saffron glaze.",
      imageUrl: "/images/dishes/chicken-tikka.jpg"
    },
    {
      name: "Delhi Street Samosa Chaat",
      cat: "Starters & Tandoor",
      pricePaise: 22000,
      isVeg: true,
      description: "Golden flaky samosa crushed over spiced chickpeas, topped with chilled sweetened curd, tamarind glaze and pomegranate seeds.",
      imageUrl: "/images/dishes/samosa-chaat.jpg"
    },
    {
      name: "Dal Makhani Grand Reserve",
      cat: "Main Course & Curries",
      pricePaise: 36000,
      isVeg: true,
      description: "Black urad lentils simmered overnight for 24 hours on slow charcoal, finished with white churned butter and dairy cream.",
      imageUrl: "/images/dishes/dal-makhani.jpg"
    },
    {
      name: "Dum Handi Veg Biryani",
      cat: "Breads & Biryani",
      pricePaise: 38000,
      isVeg: true,
      description: "Aged long-grain basmati layered with royal garden vegetables, saffron milk, caramelized shallots and kewra aroma.",
      imageUrl: "/images/dishes/veg-biryani.jpg"
    },
    {
      name: "Garlic Butter Naan",
      cat: "Breads & Biryani",
      pricePaise: 9500,
      isVeg: true,
      description: "Leavened tandoor flatbread brushed with crushed roasted garlic, sea salt and melted farm butter.",
      imageUrl: "/images/dishes/butter-naan.jpg"
    },
    {
      name: "Crispy Mysore Masala Dosa",
      cat: "Breads & Biryani",
      pricePaise: 24000,
      isVeg: true,
      description: "Golden fermented rice crepe smeared with fiery red garlic chutney, filled with tempered spiced potato mash.",
      imageUrl: "/images/dishes/masala-dosa.jpg"
    },
    {
      name: "Wild Truffle Mushroom Pasta",
      cat: "Artisan Pizza & Continental",
      pricePaise: 48000,
      isVeg: true,
      description: "Handmade fettuccine ribbons tossed with porcini mushrooms, black truffle oil emulsion, thyme and 24-month aged parmesan.",
      imageUrl: "/images/dishes/truffle-pasta.jpg"
    },
    {
      name: "Wood-Fired Margherita Pizza",
      cat: "Artisan Pizza & Continental",
      pricePaise: 45000,
      isVeg: true,
      description: "San Marzano D.O.P tomato sauce, fresh buffalo bocconcini mozzarella, extra virgin olive oil and sweet basil.",
      imageUrl: "/images/dishes/margherita-pizza.jpg"
    },
    {
      name: "Double Smash Gourmet Burger",
      cat: "Artisan Pizza & Continental",
      pricePaise: 39000,
      isVeg: false,
      description: "Seared artisanal patty, double sharp cheddar, dill gherkins, caramelized onions and secret house sauce on toasted brioche.",
      imageUrl: "/images/dishes/burger.jpg"
    },
    {
      name: "Alphonso Mango Lassi",
      cat: "Beverages & Mocktails",
      pricePaise: 18000,
      isVeg: true,
      description: "Pure Ratnagiri Alphonso pulp churned with rich velvety yogurt, green cardamom dust and silvered pistachios.",
      imageUrl: "/images/dishes/mango-lassi.jpg"
    },
    {
      name: "Nitro Cold Brew Coffee",
      cat: "Beverages & Mocktails",
      pricePaise: 21000,
      isVeg: true,
      description: "Chikmagalur single-estate coffee steeped cold for 18 hours, served silky smooth over clear artisan ice.",
      imageUrl: "/images/dishes/cold-brew.jpg"
    },
    {
      name: "Classic Fresh Mint Mojito",
      cat: "Beverages & Mocktails",
      pricePaise: 19500,
      isVeg: true,
      description: "Muddled fresh mint sprigs, Mexican lime juice, cane sugar syrup and bubbling sparkling soda.",
      imageUrl: "/images/dishes/mojito.jpg"
    },
    {
      name: "Warm Shahi Gulab Jamun (2 pcs)",
      cat: "Desserts & Sweets",
      pricePaise: 16000,
      isVeg: true,
      description: "Fried khoya dumplings soaked in saffron and rose petal syrup, garnished with 24k edible gold leaf and almond slivers.",
      imageUrl: "/images/dishes/gulab-jamun.jpg"
    }
  ];

  const createdProducts = [];
  for (const p of products) {
    const categoryId = categoryMap.get(p.cat)!;
    const prodId = `${branch.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const prod = await db.product.upsert({
      where: { id: prodId },
      update: {
        categoryId,
        pricePaise: p.pricePaise,
        description: p.description,
        isVeg: p.isVeg,
        imageUrl: p.imageUrl,
        isAvailable: true
      },
      create: {
        id: prodId,
        branchId: branch.id,
        categoryId,
        name: p.name,
        pricePaise: p.pricePaise,
        description: p.description,
        isVeg: p.isVeg,
        imageUrl: p.imageUrl,
        isAvailable: true
      }
    });
    createdProducts.push(prod);
  }

  // 6. Tables with realistic zones and capacities
  const tables = [
    { name: "T01", capacity: 2, zone: "Main Dining", status: TableStatus.OCCUPIED },
    { name: "T02", capacity: 4, zone: "Main Dining", status: TableStatus.OCCUPIED },
    { name: "T03", capacity: 4, zone: "Main Dining", status: TableStatus.AVAILABLE },
    { name: "T04", capacity: 6, zone: "Main Dining", status: TableStatus.BILL_REQUESTED },
    { name: "T05", capacity: 2, zone: "Main Dining", status: TableStatus.AVAILABLE },
    { name: "T06", capacity: 4, zone: "Main Dining", status: TableStatus.CLEANING },
    { name: "G01", capacity: 4, zone: "Terrace Garden", status: TableStatus.OCCUPIED },
    { name: "G02", capacity: 6, zone: "Terrace Garden", status: TableStatus.AVAILABLE },
    { name: "G03", capacity: 2, zone: "Terrace Garden", status: TableStatus.AVAILABLE },
    { name: "VIP-1", capacity: 8, zone: "Private Lounge", status: TableStatus.OCCUPIED },
    { name: "VIP-2", capacity: 6, zone: "Private Lounge", status: TableStatus.AVAILABLE },
    { name: "BAR-1", capacity: 2, zone: "Bar Lounge", status: TableStatus.AVAILABLE },
    { name: "BAR-2", capacity: 2, zone: "Bar Lounge", status: TableStatus.OCCUPIED }
  ];

  const tableMap = new Map<string, string>();
  for (const t of tables) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const createdTable = await db.diningTable.upsert({
      where: { branchId_name: { branchId: branch.id, name: t.name } },
      update: { capacity: t.capacity, zone: t.zone, status: t.status },
      create: {
        branchId: branch.id,
        name: t.name,
        capacity: t.capacity,
        zone: t.zone,
        status: t.status,
        qrTokenHash: tokenHash
      }
    });
    tableMap.set(t.name, createdTable.id);
  }

  // 7. Seed Sample Orders with items & payments
  const sampleOrders = [
    {
      orderNumber: 101,
      tableName: "T01",
      status: OrderStatus.PREPARING,
      type: OrderType.DINE_IN,
      notes: "Less spicy in Dal Makhani please",
      items: [
        { prod: createdProducts[0], qty: 2 }, // Paneer Tikka
        { prod: createdProducts[3], qty: 1 }, // Dal Makhani
        { prod: createdProducts[5], qty: 3 }  // Garlic Naan
      ]
    },
    {
      orderNumber: 102,
      tableName: "T02",
      status: OrderStatus.ACCEPTED,
      type: OrderType.DINE_IN,
      notes: "Extra lime on side",
      items: [
        { prod: createdProducts[1], qty: 2 }, // Chicken Tikka
        { prod: createdProducts[4], qty: 2 }, // Veg Biryani
        { prod: createdProducts[10], qty: 2 } // Mango Lassi
      ]
    },
    {
      orderNumber: 103,
      tableName: "G01",
      status: OrderStatus.READY,
      type: OrderType.DINE_IN,
      notes: "Table anniversary celebration",
      items: [
        { prod: createdProducts[7], qty: 2 }, // Truffle Pasta
        { prod: createdProducts[8], qty: 1 }, // Margherita Pizza
        { prod: createdProducts[12], qty: 2 } // Mojito
      ]
    },
    {
      orderNumber: 104,
      tableName: "VIP-1",
      status: OrderStatus.SERVED,
      type: OrderType.DINE_IN,
      notes: "Serve desserts after main course",
      items: [
        { prod: createdProducts[0], qty: 3 },
        { prod: createdProducts[1], qty: 3 },
        { prod: createdProducts[3], qty: 2 },
        { prod: createdProducts[5], qty: 6 },
        { prod: createdProducts[13], qty: 4 } // Gulab Jamun
      ]
    },
    {
      orderNumber: 105,
      tableName: "T04",
      status: OrderStatus.COMPLETED,
      type: OrderType.DINE_IN,
      notes: "Cash payment settled",
      items: [
        { prod: createdProducts[9], qty: 2 }, // Burger
        { prod: createdProducts[11], qty: 2 } // Cold Brew
      ],
      payment: { method: PaymentMethod.CASH, amountPaise: 120000 }
    },
    {
      orderNumber: 106,
      tableName: "BAR-2",
      status: OrderStatus.COMPLETED,
      type: OrderType.DINE_IN,
      notes: "UPI payment received",
      items: [
        { prod: createdProducts[2], qty: 2 }, // Samosa chaat
        { prod: createdProducts[10], qty: 2 } // Mango lassi
      ],
      payment: { method: PaymentMethod.UPI, amountPaise: 80000 }
    }
  ];

  for (const o of sampleOrders) {
    const tableId = o.tableName ? tableMap.get(o.tableName) : null;
    const subtotal = o.items.reduce((acc, i) => acc + (i.prod.pricePaise * i.qty), 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + tax;

    const existingOrder = await db.order.findUnique({
      where: { branchId_orderNumber: { branchId: branch.id, orderNumber: o.orderNumber } }
    });

    if (!existingOrder) {
      const created = await db.order.create({
        data: {
          branchId: branch.id,
          orderNumber: o.orderNumber,
          tableId,
          type: o.type,
          status: o.status,
          subtotalPaise: subtotal,
          taxPaise: tax,
          discountPaise: 0,
          totalPaise: total,
          notes: o.notes,
          idempotencyKey: `seed-order-${o.orderNumber}-${Date.now()}`,
          items: {
            create: o.items.map(i => ({
              productId: i.prod.id,
              productName: i.prod.name,
              quantity: i.qty,
              unitPricePaise: i.prod.pricePaise,
              lineTotalPaise: i.prod.pricePaise * i.qty,
              notes: ""
            }))
          }
        }
      });

      if (o.payment) {
        await db.payment.create({
          data: {
            orderId: created.id,
            amountPaise: total,
            method: o.payment.method,
            status: PaymentStatus.PAID,
            provider: "POS_TERMINAL",
            idempotencyKey: `seed-payment-${o.orderNumber}`
          }
        });
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`SUCCESS: Seeded ${restaurant.name}`);
  console.log(`Branch: ${branch.name}`);
  console.log(`Login: ${email}  /  Password: ChangeMe123!`);
  console.log(`Categories: ${categoriesData.length}`);
  console.log(`Dishes with Images: ${products.length}`);
  console.log(`Tables: ${tables.length}`);
  console.log(`======================================================\n`);
}

main().catch(e => {
  console.error("Seed error:", e);
  process.exit(1);
}).finally(() => db.$disconnect());
