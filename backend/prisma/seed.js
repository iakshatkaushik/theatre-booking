const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    // ─── 1. Create Admin User ─────────────────────────
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@theatre.com' },
        update: {},
        create: {
            email: 'admin@theatre.com',
            name: 'System Admin',
            phone: '9999999999',
            password_hash: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log(`✅ Admin user created: ${admin.email}`);

    // ─── 2. Create Demo User ──────────────────────────
    const userPassword = await bcrypt.hash('User@123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'user@theatre.com' },
        update: {},
        create: {
            email: 'user@theatre.com',
            name: 'John Doe',
            phone: '8888888888',
            password_hash: userPassword,
            role: 'USER',
        },
    });
    console.log(`✅ Demo user created: ${user.email}`);

    // ─── 3. Create Halls ──────────────────────────────
    const hallsData = [
        { name: 'Audi 1 - Grand', total_seats: 150 },
        { name: 'Audi 2 - Premium', total_seats: 100 },
        { name: 'Audi 3 - IMAX', total_seats: 200 },
        { name: 'Audi 4 - Compact', total_seats: 80 },
        { name: 'Audi 5 - VIP Lounge', total_seats: 50 },
    ];

    const halls = [];
    for (const hallData of hallsData) {
        const hall = await prisma.hall.upsert({
            where: { name: hallData.name },
            update: {},
            create: hallData,
        });
        halls.push(hall);
    }
    console.log(`✅ ${halls.length} halls created`);

    // ─── 4. Create Individual Seats ────────────────────
    const seatConfigs = [
        // Hall 1: Grand (150 seats)
        {
            hallIndex: 0, rows: [
                { prefix: 'A', count: 20, category: 'STANDARD' },
                { prefix: 'B', count: 20, category: 'STANDARD' },
                { prefix: 'C', count: 20, category: 'STANDARD' },
                { prefix: 'D', count: 20, category: 'PREMIUM' },
                { prefix: 'E', count: 20, category: 'PREMIUM' },
                { prefix: 'F', count: 15, category: 'VIP' },
                { prefix: 'G', count: 15, category: 'VIP' },
                { prefix: 'H', count: 10, category: 'BALCONY' },
                { prefix: 'J', count: 10, category: 'BOX' },
            ]
        },
        // Hall 2: Premium (100 seats)
        {
            hallIndex: 1, rows: [
                { prefix: 'A', count: 15, category: 'STANDARD' },
                { prefix: 'B', count: 15, category: 'STANDARD' },
                { prefix: 'C', count: 15, category: 'PREMIUM' },
                { prefix: 'D', count: 15, category: 'PREMIUM' },
                { prefix: 'E', count: 15, category: 'VIP' },
                { prefix: 'F', count: 10, category: 'VIP' },
                { prefix: 'G', count: 10, category: 'BALCONY' },
                { prefix: 'H', count: 5, category: 'BOX' },
            ]
        },
        // Hall 3: IMAX (200 seats)
        {
            hallIndex: 2, rows: [
                { prefix: 'A', count: 25, category: 'STANDARD' },
                { prefix: 'B', count: 25, category: 'STANDARD' },
                { prefix: 'C', count: 25, category: 'STANDARD' },
                { prefix: 'D', count: 25, category: 'PREMIUM' },
                { prefix: 'E', count: 25, category: 'PREMIUM' },
                { prefix: 'F', count: 20, category: 'VIP' },
                { prefix: 'G', count: 20, category: 'VIP' },
                { prefix: 'H', count: 15, category: 'BALCONY' },
                { prefix: 'J', count: 10, category: 'BALCONY' },
                { prefix: 'K', count: 10, category: 'BOX' },
            ]
        },
        // Hall 4: Compact (80 seats)
        {
            hallIndex: 3, rows: [
                { prefix: 'A', count: 15, category: 'STANDARD' },
                { prefix: 'B', count: 15, category: 'STANDARD' },
                { prefix: 'C', count: 15, category: 'PREMIUM' },
                { prefix: 'D', count: 15, category: 'VIP' },
                { prefix: 'E', count: 10, category: 'BALCONY' },
                { prefix: 'F', count: 10, category: 'BOX' },
            ]
        },
        // Hall 5: VIP Lounge (50 seats)
        {
            hallIndex: 4, rows: [
                { prefix: 'A', count: 10, category: 'VIP' },
                { prefix: 'B', count: 10, category: 'VIP' },
                { prefix: 'C', count: 10, category: 'VIP' },
                { prefix: 'D', count: 10, category: 'BOX' },
                { prefix: 'E', count: 10, category: 'BOX' },
            ]
        },
    ];

    let totalSeats = 0;
    for (const config of seatConfigs) {
        const hallId = halls[config.hallIndex].id;

        // Check if seats exist for this hall
        const existingCount = await prisma.seat.count({ where: { hall_id: hallId } });
        if (existingCount > 0) {
            console.log(`⏭️  Seats already exist for ${halls[config.hallIndex].name}`);
            totalSeats += existingCount;
            continue;
        }

        const seatData = [];
        for (const row of config.rows) {
            for (let i = 1; i <= row.count; i++) {
                seatData.push({
                    hall_id: hallId,
                    row_number: row.prefix,
                    seat_number: i,
                    seat_category: row.category,
                });
            }
        }

        await prisma.seat.createMany({ data: seatData });
        totalSeats += seatData.length;
    }
    console.log(`✅ ${totalSeats} individual seats created across ${halls.length} halls`);

    // ─── 5. Create Movies ─────────────────────────────
    const moviesData = [
        {
            title: 'The Dark Knight Returns',
            duration_minutes: 152,
            language: 'English',
            genre: ['Action', 'Drama', 'Thriller'],
            poster_url: null,
            description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        },
        {
            title: 'Inception: Dream Within',
            duration_minutes: 148,
            language: 'English',
            genre: ['Sci-Fi', 'Action', 'Thriller'],
            poster_url: null,
            description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        },
        {
            title: 'Parasite',
            duration_minutes: 132,
            language: 'Korean',
            genre: ['Drama', 'Thriller'],
            poster_url: null,
            description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
        },
        {
            title: 'Spirited Away: Remastered',
            duration_minutes: 125,
            language: 'Japanese',
            genre: ['Animation', 'Adventure', 'Fantasy'],
            poster_url: null,
            description: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.',
        },
        {
            title: 'La La Land',
            duration_minutes: 128,
            language: 'English',
            genre: ['Drama', 'Musical', 'Romance'],
            poster_url: null,
            description: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
        },
        {
            title: 'Dune: Part Three',
            duration_minutes: 166,
            language: 'English',
            genre: ['Sci-Fi', 'Adventure', 'Drama'],
            poster_url: null,
            description: 'The epic continuation of the desert planet saga, where the fate of the universe hangs in the balance.',
        },
        {
            title: 'RRR: Rise Roar Revolt',
            duration_minutes: 187,
            language: 'Hindi',
            genre: ['Action', 'Drama'],
            poster_url: null,
            description: 'A fictitious story about two legendary Indian revolutionaries and their journey away from home before they began fighting for their country.',
        },
        {
            title: 'Everything Everywhere All at Once',
            duration_minutes: 139,
            language: 'English',
            genre: ['Action', 'Comedy', 'Sci-Fi'],
            poster_url: null,
            description: 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save what\'s important to her by connecting with the lives she could have led in other universes.',
        },
    ];

    const movies = [];
    for (const movieData of moviesData) {
        const movie = await prisma.movie.upsert({
            where: { id: movies.length + 1 },
            update: {},
            create: movieData,
        });
        movies.push(movie);
    }
    console.log(`✅ ${movies.length} movies created`);

    // ─── 6. Create Shows (Future Dates) ───────────────
    const showsData = [];
    const today = new Date();
    const timeSlots = ['10:00', '13:30', '17:00', '20:30', '23:00'];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const showDate = new Date(today);
        showDate.setDate(showDate.getDate() + dayOffset);

        // Assign movies to halls with different time slots
        const assignments = [
            { movieIndex: dayOffset % movies.length, hallIndex: 0, timeIndex: 0 },
            { movieIndex: (dayOffset + 1) % movies.length, hallIndex: 0, timeIndex: 2 },
            { movieIndex: (dayOffset + 2) % movies.length, hallIndex: 1, timeIndex: 1 },
            { movieIndex: (dayOffset + 3) % movies.length, hallIndex: 1, timeIndex: 3 },
            { movieIndex: (dayOffset + 4) % movies.length, hallIndex: 2, timeIndex: 0 },
            { movieIndex: (dayOffset + 5) % movies.length, hallIndex: 2, timeIndex: 2 },
            { movieIndex: (dayOffset + 6) % movies.length, hallIndex: 3, timeIndex: 1 },
            { movieIndex: (dayOffset + 7) % movies.length, hallIndex: 4, timeIndex: 4 },
        ];

        for (const assign of assignments) {
            const [hours, minutes] = timeSlots[assign.timeIndex].split(':');
            const datetime = new Date(showDate);
            datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            showsData.push({
                movie_id: movies[assign.movieIndex].id,
                hall_id: halls[assign.hallIndex].id,
                show_datetime: datetime,
            });
        }
    }

    // Delete existing shows to avoid duplicates on re-seed
    await prisma.bookingSeat.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.seatPricing.deleteMany({});
    await prisma.show.deleteMany({});

    const createdShows = [];
    for (const showData of showsData) {
        const show = await prisma.show.create({ data: showData });
        createdShows.push(show);
    }
    console.log(`✅ ${createdShows.length} shows created across 7 days`);

    // ─── 7. Create Seat Pricings ───────────────────────
    const pricingTiers = {
        STANDARD: 150,
        PREMIUM: 250,
        VIP: 400,
        BALCONY: 350,
        BOX: 500,
    };

    const pricingData = [];
    for (const show of createdShows) {
        for (const [category, price] of Object.entries(pricingTiers)) {
            pricingData.push({
                show_id: show.id,
                seat_category: category,
                price,
            });
        }
    }

    await prisma.seatPricing.createMany({ data: pricingData });
    console.log(`✅ ${pricingData.length} seat pricing entries created`);

    console.log('\n🎬 Database seeded successfully!');
    console.log('────────────────────────────────');
    console.log(`Admin login: admin@theatre.com / Admin@123`);
    console.log(`User login:  user@theatre.com / User@123`);
    console.log('────────────────────────────────\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
