require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is missing from .env.local");
    process.exit(1);
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
    console.log("Creating $1 Trial Product...");

    const product = await stripe.products.create({
        name: '$1 Trial Plan',
        description: '1 Article Generation, No CMS Publishing',
        metadata: {
            plan: 'trial'
        }
    });

    console.log("✅ Product created successfully. ID:", product.id);

    console.log("\nCreating $1 Subscription Price...");
    const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 100, // $1.00 USD
        currency: 'usd',
        recurring: {
            interval: 'month'
        },
        metadata: {
            plan: 'trial'
        }
    });

    console.log("✅ Price created successfully. ID:", price.id);

    console.log("\n==================================");
    console.log("🚀 SETUP COMPLETE");
    console.log("Product ID:", product.id);
    console.log("Price ID:  ", price.id);
    console.log("==================================\n");
}

main().catch(err => {
    console.error("❌ Failed to create trial plan:", err);
    process.exit(1);
});
