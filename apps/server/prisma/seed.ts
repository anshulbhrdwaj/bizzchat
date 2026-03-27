import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding BizChat database...')

  // Clean existing data
  await prisma.$transaction([
    prisma.messageReaction.deleteMany(),
    prisma.message.deleteMany(),
    prisma.chatMember.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.orderStatusHistory.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.sharedCartItem.deleteMany(),
    prisma.sharedCart.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.productCollection.deleteMany(),
    prisma.variantValue.deleteMany(),
    prisma.variantGroup.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.catalogCollection.deleteMany(),
    prisma.businessProfile.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.otpCode.deleteMany(),
    prisma.user.deleteMany(),
  ])

  // ─── Users ─────────────────────────────────────────────
  console.log('  Creating users...')

  const user1 = await prisma.user.create({
    data: {
      phone: '+919999000001',
      name: 'Darpan Kumar',
      avatarUrl: null,
      isOnline: false,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      phone: '+919999000002',
      name: 'Meena Sharma',
      avatarUrl: null,
      isOnline: false,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      phone: '+919999000003',
      name: 'Rajesh Customer',
      avatarUrl: null,
      isOnline: false,
    },
  })

  // ─── Business 1: Darpan Paper Plates ───────────────────
  console.log('  Creating Darpan Paper Plates...')

  const biz1 = await prisma.businessProfile.create({
    data: {
      userId: user1.id,
      name: 'Darpan Paper Plates',
      category: 'Disposable Products',
      description: 'Premium quality paper plates, bowls, and cups for all occasions. Eco-friendly and biodegradable.',
      address: '12, Paper Market, Sadar Bazaar, Delhi 110006',
      email: 'darpan@paperplates.in',
      website: 'https://darpanpaperplates.in',
    },
  })

  // Collections for Biz 1
  const biz1Collections = await Promise.all([
    prisma.catalogCollection.create({
      data: { businessId: biz1.id, name: 'Paper Plates', description: 'Round and square paper plates', sortOrder: 0 },
    }),
    prisma.catalogCollection.create({
      data: { businessId: biz1.id, name: 'Paper Bowls', description: 'Bowls for soups and desserts', sortOrder: 1 },
    }),
    prisma.catalogCollection.create({
      data: { businessId: biz1.id, name: 'Paper Cups', description: 'Hot and cold beverage cups', sortOrder: 2 },
    }),
  ])

  // Products for Biz 1
  const biz1Products = [
    // Paper Plates (4 products)
    { name: 'Round Plate 6"', desc: 'Classic 6 inch round plate. Pack of 50.', price: 149, col: 0 },
    { name: 'Round Plate 9"', desc: 'Large 9 inch round plate. Pack of 50.', price: 199, col: 0 },
    { name: 'Square Plate 7"', desc: 'Modern square plate. Pack of 25.', price: 179, col: 0 },
    { name: 'Compartment Plate', desc: '3-compartment thali plate. Pack of 25.', price: 249, col: 0 },
    // Paper Bowls (4 products)
    { name: 'Small Bowl 200ml', desc: 'Perfect for chutneys. Pack of 50.', price: 129, col: 1 },
    { name: 'Medium Bowl 350ml', desc: 'Ideal for soups. Pack of 50.', price: 169, col: 1 },
    { name: 'Large Bowl 500ml', desc: 'Great for salads. Pack of 25.', price: 189, col: 1 },
    { name: 'Dona Bowl Traditional', desc: 'Traditional leaf-shaped bowl. Pack of 100.', price: 99, col: 1 },
    // Paper Cups (4 products)
    { name: 'Tea Cup 100ml', desc: 'Standard chai cup. Pack of 100.', price: 149, col: 2 },
    { name: 'Coffee Cup 200ml', desc: 'Double-wall insulated. Pack of 50.', price: 199, col: 2 },
    { name: 'Cold Drink Cup 300ml', desc: 'With lid. Pack of 50.', price: 229, col: 2 },
    { name: 'Party Cup 350ml', desc: 'Printed party cups. Pack of 25.', price: 179, col: 2 },
  ]

  for (const p of biz1Products) {
    const product = await prisma.product.create({
      data: {
        businessId: biz1.id,
        name: p.name,
        description: p.desc,
        basePrice: p.price,
        collections: {
          create: { collectionId: biz1Collections[p.col].id },
        },
      },
    })

    // Add variants (Size + Material) for each product
    await prisma.variantGroup.create({
      data: {
        productId: product.id,
        name: 'Size',
        sortOrder: 0,
        values: {
          create: [
            { label: 'Standard', priceOverride: null, stock: 500, sortOrder: 0 },
            { label: 'Premium', priceOverride: new Prisma.Decimal(p.price * 1.5), stock: 200, sortOrder: 1 },
          ],
        },
      },
    })

    await prisma.variantGroup.create({
      data: {
        productId: product.id,
        name: 'Material',
        sortOrder: 1,
        values: {
          create: [
            { label: 'Plain White', priceOverride: null, stock: 800, sortOrder: 0 },
            { label: 'Printed', priceOverride: new Prisma.Decimal(p.price + 30), stock: 300, sortOrder: 1 },
            { label: 'Laminated', priceOverride: new Prisma.Decimal(p.price + 50), stock: 150, sortOrder: 2 },
          ],
        },
      },
    })
  }

  // ─── Business 2: Meena Fashion ─────────────────────────
  console.log('  Creating Meena Fashion...')

  const biz2 = await prisma.businessProfile.create({
    data: {
      userId: user2.id,
      name: 'Meena Fashion',
      category: 'Fashion & Clothing',
      description: 'Trendy ethnic and western wear for women. Quality fabrics at wholesale prices.',
      address: '45, Fashion Street, Lajpat Nagar, Delhi 110024',
      email: 'meena@fashion.in',
      website: 'https://meenafashion.in',
    },
  })

  // Collections for Biz 2
  const biz2Collections = await Promise.all([
    prisma.catalogCollection.create({
      data: { businessId: biz2.id, name: 'Kurtis', description: 'Designer kurtis for every occasion', sortOrder: 0 },
    }),
    prisma.catalogCollection.create({
      data: { businessId: biz2.id, name: 'Sarees', description: 'Traditional and modern sarees', sortOrder: 1 },
    }),
    prisma.catalogCollection.create({
      data: { businessId: biz2.id, name: 'Tops & Tunics', description: 'Casual and party wear tops', sortOrder: 2 },
    }),
    prisma.catalogCollection.create({
      data: { businessId: biz2.id, name: 'Dupattas', description: 'Matching and contrast dupattas', sortOrder: 3 },
    }),
  ])

  // Products for Biz 2
  const biz2Products = [
    // Kurtis (4 products)
    { name: 'Anarkali Kurti', desc: 'Embroidered Anarkali with mirror work.', price: 1299, col: 0 },
    { name: 'Straight Kurti', desc: 'Office-wear cotton kurti.', price: 799, col: 0 },
    { name: 'A-Line Kurti', desc: 'Rayon A-line with block print.', price: 899, col: 0 },
    { name: 'Palazzo Set', desc: 'Kurti + palazzo + dupatta set.', price: 1599, col: 0 },
    // Sarees (4 products)
    { name: 'Banarasi Silk', desc: 'Pure Banarasi silk with zari border.', price: 3499, col: 1 },
    { name: 'Chiffon Saree', desc: 'Lightweight chiffon with sequin work.', price: 1999, col: 1 },
    { name: 'Cotton Saree', desc: 'Daily wear handloom cotton.', price: 899, col: 1 },
    { name: 'Georgette Saree', desc: 'Party wear georgette with blouse.', price: 2499, col: 1 },
    // Tops (4 products)
    { name: 'Crop Top', desc: 'Stylish crop top with ruffle sleeves.', price: 499, col: 2 },
    { name: 'Peplum Top', desc: 'Peplum style with floral print.', price: 599, col: 2 },
    { name: 'Tunic Top', desc: 'Long tunic with side slits.', price: 699, col: 2 },
    { name: 'Shirt Style Top', desc: 'Formal shirt-style top.', price: 549, col: 2 },
    // Dupattas (4 products)
    { name: 'Phulkari Dupatta', desc: 'Hand-embroidered Phulkari.', price: 799, col: 3 },
    { name: 'Chiffon Dupatta', desc: 'Plain chiffon in 20 colors.', price: 299, col: 3 },
    { name: 'Bandhani Dupatta', desc: 'Rajasthani Bandhani print.', price: 499, col: 3 },
    { name: 'Net Dupatta', desc: 'Embellished net dupatta.', price: 599, col: 3 },
  ]

  for (const p of biz2Products) {
    const product = await prisma.product.create({
      data: {
        businessId: biz2.id,
        name: p.name,
        description: p.desc,
        basePrice: p.price,
        collections: {
          create: { collectionId: biz2Collections[p.col].id },
        },
      },
    })

    // Size variants
    await prisma.variantGroup.create({
      data: {
        productId: product.id,
        name: 'Size',
        sortOrder: 0,
        values: {
          create: [
            { label: 'S', stock: 25, sortOrder: 0 },
            { label: 'M', stock: 40, sortOrder: 1 },
            { label: 'L', stock: 35, sortOrder: 2 },
            { label: 'XL', stock: 20, sortOrder: 3 },
            { label: 'XXL', priceOverride: new Prisma.Decimal(p.price + 100), stock: 10, sortOrder: 4 },
          ],
        },
      },
    })

    // Color variants
    await prisma.variantGroup.create({
      data: {
        productId: product.id,
        name: 'Color',
        sortOrder: 1,
        values: {
          create: [
            { label: 'Red', stock: 30, sortOrder: 0 },
            { label: 'Blue', stock: 25, sortOrder: 1 },
            { label: 'Green', stock: 20, sortOrder: 2 },
            { label: 'Black', stock: 35, sortOrder: 3 },
          ],
        },
      },
    })
  }

  // ─── Chats & Messages ──────────────────────────────────
  console.log('  Creating chats and messages...')

  // Chat between Customer (user3) and Darpan (user1)
  const chat1 = await prisma.chat.create({
    data: {
      members: {
        create: [{ userId: user1.id }, { userId: user3.id }],
      },
    },
  })

  const chat1Messages = [
    { senderId: user3.id, content: 'Hi, I need paper plates for a party this weekend', type: 'TEXT' as const, minutesAgo: 120 },
    { senderId: user1.id, content: 'Hello Rajesh! Sure, how many guests are you expecting?', type: 'TEXT' as const, minutesAgo: 118 },
    { senderId: user3.id, content: 'Around 50 people. Need plates, bowls and cups.', type: 'TEXT' as const, minutesAgo: 115 },
    { senderId: user1.id, content: 'Perfect! I\'d recommend our combo pack. Let me share a cart for you.', type: 'TEXT' as const, minutesAgo: 112 },
    { senderId: user1.id, content: 'I have shared a cart with all the items you need. Check it out!', type: 'TEXT' as const, minutesAgo: 108 },
    { senderId: user3.id, content: 'Looks great! What\'s the delivery timeline?', type: 'TEXT' as const, minutesAgo: 100 },
    { senderId: user1.id, content: 'We deliver within 24 hours in Delhi NCR. Free delivery on orders above ₹500!', type: 'TEXT' as const, minutesAgo: 95 },
    { senderId: user3.id, content: 'Perfect, placing the order now 🎉', type: 'TEXT' as const, minutesAgo: 90 },
  ]

  for (const msg of chat1Messages) {
    await prisma.message.create({
      data: {
        chatId: chat1.id,
        senderId: msg.senderId,
        content: msg.content,
        type: msg.type,
        createdAt: new Date(Date.now() - msg.minutesAgo * 60 * 1000),
      },
    })
  }

  // Chat between Customer (user3) and Meena (user2)
  const chat2 = await prisma.chat.create({
    data: {
      members: {
        create: [{ userId: user2.id }, { userId: user3.id }],
      },
    },
  })

  const chat2Messages = [
    { senderId: user3.id, content: 'Do you have Anarkali kurtis in size M?', type: 'TEXT' as const, minutesAgo: 60 },
    { senderId: user2.id, content: 'Yes! We have beautiful Anarkali kurtis. Check our catalog.', type: 'TEXT' as const, minutesAgo: 55 },
    { senderId: user3.id, content: 'The red one looks great. Is it available?', type: 'TEXT' as const, minutesAgo: 50 },
    { senderId: user2.id, content: 'Yes, available in M. Adding to your cart. 😊', type: 'TEXT' as const, minutesAgo: 45 },
    { senderId: user3.id, content: 'Thanks! Also adding the Phulkari dupatta', type: 'TEXT' as const, minutesAgo: 40 },
  ]

  for (const msg of chat2Messages) {
    await prisma.message.create({
      data: {
        chatId: chat2.id,
        senderId: msg.senderId,
        content: msg.content,
        type: msg.type,
        createdAt: new Date(Date.now() - msg.minutesAgo * 60 * 1000),
      },
    })
  }

  // Chat between the two business owners
  const chat3 = await prisma.chat.create({
    data: {
      members: {
        create: [{ userId: user1.id }, { userId: user2.id }],
      },
    },
  })

  await prisma.message.create({
    data: {
      chatId: chat3.id,
      senderId: user1.id,
      content: 'Hey Meena, do you need disposable plates for your fashion show event?',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 180 * 60 * 1000),
    },
  })
  await prisma.message.create({
    data: {
      chatId: chat3.id,
      senderId: user2.id,
      content: 'Yes! We need about 200 plates and cups. Can you give wholesale price?',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 175 * 60 * 1000),
    },
  })

  // ─── Orders ────────────────────────────────────────────
  console.log('  Creating orders...')

  // Get some products for orders
  const darpanProducts = await prisma.product.findMany({
    where: { businessId: biz1.id },
    take: 3,
  })
  const meenaProducts = await prisma.product.findMany({
    where: { businessId: biz2.id },
    take: 3,
  })

  // Order statuses to create
  const orderSpecs = [
    { status: 'PENDING', biz: biz1, products: darpanProducts, daysAgo: 0, num: 'ORD-2026-001' },
    { status: 'CONFIRMED', biz: biz1, products: darpanProducts, daysAgo: 1, num: 'ORD-2026-002' },
    { status: 'PROCESSING', biz: biz2, products: meenaProducts, daysAgo: 2, num: 'ORD-2026-003' },
    { status: 'DISPATCHED', biz: biz2, products: meenaProducts, daysAgo: 3, num: 'ORD-2026-004' },
    { status: 'DELIVERED', biz: biz1, products: darpanProducts, daysAgo: 5, num: 'ORD-2026-005' },
    { status: 'DELIVERED', biz: biz2, products: meenaProducts, daysAgo: 7, num: 'ORD-2026-006' },
    { status: 'CANCELLED', biz: biz1, products: darpanProducts, daysAgo: 4, num: 'ORD-2026-007' },
  ] as const

  for (const spec of orderSpecs) {
    const items = spec.products.map((p, i) => ({
      productId: p.id,
      productName: p.name,
      unitPrice: p.basePrice,
      quantity: i + 1,
      lineTotal: new Prisma.Decimal(Number(p.basePrice) * (i + 1)),
    }))

    const total = items.reduce((sum, item) => sum + Number(item.lineTotal), 0)
    const createdAt = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000)

    // Build status history
    const statusFlow: string[] = []
    const allStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED']
    const cancelledStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED']

    if (spec.status === 'CANCELLED') {
      const idx = cancelledStatuses.indexOf(spec.status)
      for (let i = 0; i <= idx; i++) statusFlow.push(cancelledStatuses[i])
    } else {
      const idx = allStatuses.indexOf(spec.status)
      for (let i = 0; i <= idx; i++) statusFlow.push(allStatuses[i])
    }

    await prisma.order.create({
      data: {
        orderNumber: spec.num,
        userId: user3.id,
        businessId: spec.biz.id,
        status: spec.status,
        subtotal: total,
        total: total,
        deliveryAddress: '42 MG Road, New Delhi 110001',
        customerNote: spec.status === 'CANCELLED' ? 'Changed my mind' : 'Please deliver ASAP',
        createdAt,
        items: { create: items },
        statusHistory: {
          create: statusFlow.map((s, i) => ({
            status: s as any,
            note: i === 0 ? 'Order placed' : `Status changed to ${s}`,
            changedBy: s === 'PENDING' ? user3.id : spec.biz.userId,
            createdAt: new Date(createdAt.getTime() + i * 3600000),
          })),
        },
      },
    })
  }

  // ─── Shared Carts ──────────────────────────────────────
  console.log('  Creating shared carts...')

  // Get first product from each business for shared carts
  const darpanProduct1 = darpanProducts[0]
  const meenaProduct1 = meenaProducts[0]

  // Shared Cart 1: PENDING (from Darpan to Rajesh)
  await prisma.sharedCart.create({
    data: {
      businessId: biz1.id,
      recipientId: user3.id,
      note: 'Party combo pack as discussed!',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: 'PENDING',
      items: {
        create: [
          { productId: darpanProduct1.id, quantity: 2, note: 'Large size preferred' },
          { productId: darpanProducts[1]?.id ?? darpanProduct1.id, quantity: 1 },
        ],
      },
    },
  })

  // Shared Cart 2: ADDED_TO_CART (from Meena to Rajesh)
  await prisma.sharedCart.create({
    data: {
      businessId: biz2.id,
      recipientId: user3.id,
      note: 'Curated outfit for the wedding season! 💃',
      status: 'ADDED_TO_CART',
      items: {
        create: [
          { productId: meenaProduct1.id, quantity: 1, note: 'Size M, Red color' },
          { productId: meenaProducts[1]?.id ?? meenaProduct1.id, quantity: 1, note: 'Matching set' },
        ],
      },
    },
  })

  // ─── Summary ───────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    businesses: await prisma.businessProfile.count(),
    collections: await prisma.catalogCollection.count(),
    products: await prisma.product.count(),
    variantGroups: await prisma.variantGroup.count(),
    chats: await prisma.chat.count(),
    messages: await prisma.message.count(),
    orders: await prisma.order.count(),
    sharedCarts: await prisma.sharedCart.count(),
  }

  console.log('\n✅ Seed complete!')
  console.log(`   ${counts.users} users (2 business owners + 1 customer)`)
  console.log(`   ${counts.businesses} businesses`)
  console.log(`   ${counts.collections} collections`)
  console.log(`   ${counts.products} products`)
  console.log(`   ${counts.variantGroups} variant groups`)
  console.log(`   ${counts.chats} chats`)
  console.log(`   ${counts.messages} messages`)
  console.log(`   ${counts.orders} orders (all statuses)`)
  console.log(`   ${counts.sharedCarts} shared carts`)
  console.log('\n📱 Test credentials:')
  console.log('   Business 1: +919999000001 (Darpan Paper Plates)')
  console.log('   Business 2: +919999000002 (Meena Fashion)')
  console.log('   Customer:   +919999000003 (Rajesh)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
