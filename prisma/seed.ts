import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Clean existing data for idempotency
    await prisma.image.deleteMany()
    await prisma.car.deleteMany()

    const car1 = await prisma.car.create({
        data: {
            slug: '2023-porsche-911-carrera-s',
            title: '2023 Porsche 911 Carrera S',
            brand: 'Porsche',
            model: '911 Carrera S',
            year: 2023,
            mileage: 4500,
            fuel_type: 'Gasoline',
            transmission: 'Automatic (PDK)',
            price: 135000,
            horsepower: 443,
            color: 'Agate Grey Metallic',
            description: 'Stunning 911 Carrera S in immaculate condition. Features Sport Chrono Package, Sport Exhaust System, and 14-way Power Sport Seats. Full service history available. A true driver\'s car that blends daily usability with incredible performance pedigree.',
            featured: true,
            sold: false,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1503376760367-1b61b3699c27?q=80&w=2070&auto=format&fit=crop' },
                    { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2070&auto=format&fit=crop' }
                ]
            }
        }
    })

    const car2 = await prisma.car.create({
        data: {
            slug: '2022-mercedes-benz-g-class',
            title: '2022 Mercedes-Benz G-Class AMG G 63',
            brand: 'Mercedes-Benz',
            model: 'G-Class',
            year: 2022,
            mileage: 12000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            price: 165000,
            horsepower: 577,
            color: 'Obsidian Black Metallic',
            description: 'The iconic G-Wagon in its most potent AMG form. Highlights include the Exclusive Interior Package, Carbon Fiber Trim, and Night Package. This vehicle commands presence on the road. Dealer maintained since new.',
            featured: true,
            sold: false,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?q=80&w=1974&auto=format&fit=crop' }
                ]
            }
        }
    })

    const car3 = await prisma.car.create({
        data: {
            slug: '2024-audi-rs-e-tron-gt',
            title: '2024 Audi RS e-tron GT',
            brand: 'Audi',
            model: 'RS e-tron GT',
            year: 2024,
            mileage: 1200,
            fuel_type: 'Electric',
            transmission: 'Automatic',
            price: 145000,
            horsepower: 637,
            color: 'Daytona Gray Pearl',
            description: 'The future of performance. This fully electric grand tourer offers blistering acceleration, a beautifully crafted interior, and cutting-edge technology. Features include Carbon Core styling, Bang & Olufsen 3D sound, and matrix-design LED headlights.',
            featured: true,
            sold: false,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1620882863868-b3ee58b45688?q=80&w=2070&auto=format&fit=crop' }
                ]
            }
        }
    })

    const car4 = await prisma.car.create({
        data: {
            slug: '2021-bmw-m5-competition',
            title: '2021 BMW M5 Competition',
            brand: 'BMW',
            model: 'M5',
            year: 2021,
            mileage: 28000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            price: 89000,
            horsepower: 617,
            color: 'Marina Bay Blue Metallic',
            description: 'A masterpiece of engineering. The M5 Competition combines luxury refinement with track-ready performance. Includes Executive Package, Driving Assistance Plus, and Bowers & Wilkins Audio. Fastidiously maintained.',
            featured: false,
            sold: false,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=2070&auto=format&fit=crop' }
                ]
            }
        }
    })

    console.log('Seeding completed!')
    console.log(`Created ${[car1, car2, car3, car4].length} cars.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
