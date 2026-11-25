import type { Persona } from "./demo";
import { KITS, shopPersonas, type Kit, type ShopRow } from "./demo-store";
import { KITS2 } from "./demo-store2";

// Fictional shops for shop batch 3. Names are invented and unrelated to the reference sites;
// photos are CC0 (public/stock/CREDITS.txt). Copy follows the no-AI-slop rule.

const SZ = (vals: string[]) => ({ name: "Size", values: vals });

export const KITS3: Readonly<Record<string, Kit>> = Object.freeze({
  coffee: {
    collections: ["Coffee", "Brewing", "Tea"],
    products: [
      { title: "House espresso, 250 g", price: 16, description: "A washed Colombian and a natural Ethiopian, roasted for milk and for espresso.", collection: "Coffee", option1: { name: "Grind", values: ["Whole bean", "Espresso", "Filter"] }, stock: 40, featured: true, image: "coffee-beans", images: ["coffee-latte-art"] },
      { title: "Single-origin filter, 250 g", price: 19, description: "This month: a washed lot from Huila with notes of red apple and cane sugar.", collection: "Coffee", option1: { name: "Grind", values: ["Whole bean", "Filter"] }, stock: 30, featured: true, image: "coffee-pourover", images: ["coffee-hand-cup"] },
      { title: "Glass pour-over set", price: 48, description: "A borosilicate brewer, carafe and 100 paper filters.", collection: "Brewing", stock: 12, featured: true, image: "coffee-cortado" },
      { title: "Stoneware mug", price: 22, description: "Hand-thrown, 300 ml, with a dark glaze that hides the stains.", collection: "Brewing", stock: 25, featured: true, image: "coffee-black-mug" },
      { title: "Monthly subscription", price: 34, description: "Two bags of whatever we're most excited about, delivered on the first of each month.", collection: "Coffee", stock: 99, image: "coffee-hand-cup" },
      { title: "Sencha, 100 g", price: 14, description: "A bright green tea from a family farm in Shizuoka.", collection: "Tea", stock: 20, image: "tea-loose-jar", images: ["tea-glass-cup"] },
      { title: "Cast-iron teapot", price: 68, description: "A 600 ml pot with an enamelled interior and a removable infuser.", collection: "Tea", stock: 6, image: "tea-iron-pot" },
      { title: "Coffee from Turkey, 250 g", price: 15, description: "Ground very fine for the cezve, with a little cardamom.", collection: "Coffee", stock: 0, image: "coffee-turkish" },
    ],
    faqs: [
      { q: "When do you roast?", a: "Monday and Thursday. Orders ship the day after roasting." },
      { q: "Can I pause my subscription?", a: "Yes, any time before the 25th of the month, from the link in your email." },
      { q: "Which grind should I choose?", a: "Whole bean if you have a grinder. Otherwise choose the grind for how you brew and we'll set it for you." },
    ],
  },

  drinks: {
    collections: ["Bottles", "Mixers", "Glassware"],
    products: [
      { title: "Garden aperitif, 70 cl", price: 32, description: "A bitter, non-alcoholic aperitif of grapefruit peel, gentian and rosemary.", collection: "Bottles", stock: 24, featured: true, image: "drink-negroni", images: ["drink-pour"] },
      { title: "Citrus botanical, 70 cl", price: 30, description: "Bergamot, yuzu and juniper. Mix with tonic and plenty of ice.", collection: "Bottles", stock: 30, featured: true, image: "drink-citrus-tonic", images: ["drink-gin-tonic"] },
      { title: "Sparkling spritz, 4 cans", price: 14, description: "Bitter orange and soda, lightly sweetened, 250 ml cans.", collection: "Mixers", stock: 50, featured: true, image: "drink-spritz" },
      { title: "Citrus soda, 4 cans", price: 12, description: "Sicilian citrus and sparkling water, nothing else.", collection: "Mixers", stock: 48, featured: true, image: "drink-lemon-soda" },
      { title: "Highball glasses, pair", price: 28, description: "Mouth-blown glasses with a heavy base, 350 ml.", collection: "Glassware", stock: 15, image: "drink-gin-tonic" },
      { title: "Red blend, 75 cl", price: 24, description: "A light, chillable red from old vines. Low intervention.", collection: "Bottles", stock: 18, image: "drink-wine-bottle", images: ["drink-wine-pour"] },
      { title: "Tasting glasses, set of 4", price: 36, description: "Thin-rimmed glasses for wine and spirits.", collection: "Glassware", stock: 10, image: "drink-wine-glasses" },
    ],
    faqs: [
      { q: "Do you deliver alcohol?", a: "Yes, to adults only. The courier checks ID on delivery." },
      { q: "How long does an opened bottle keep?", a: "Three months in the fridge for our aperitifs, a few days for wine." },
    ],
  },

  food: {
    collections: ["Pantry", "Sweet", "Gifts"],
    products: [
      { title: "Dark chocolate bar, 70%", price: 8, description: "Single-origin cacao from Ecuador, stone-ground in small batches.", collection: "Sweet", stock: 60, featured: true, image: "food-chocolate-stack", images: ["food-chocolate-berries"] },
      { title: "Hazelnut spread", price: 11, description: "Roasted Piedmont hazelnuts and cocoa, with less sugar.", collection: "Pantry", stock: 35, featured: true, image: "food-spread-jar" },
      { title: "Bronze-cut pasta, 500 g", price: 7, description: "Durum wheat dried slowly for a rough surface that holds sauce.", collection: "Pantry", option1: { name: "Shape", values: ["Spaghetti", "Rigatoni", "Casarecce"] }, stock: 80, featured: true, image: "food-pasta-jar", images: ["food-spaghetti-flatlay"] },
      { title: "Chocolate chip cookies, box of 6", price: 18, description: "Brown butter, sea salt and two kinds of chocolate. Baked the day we ship.", collection: "Sweet", stock: 40, featured: true, image: "food-cookies" },
      { title: "Fresh pasta kit", price: 26, description: "Flour, semolina, a wooden board and a recipe card for four.", collection: "Gifts", stock: 12, image: "food-fresh-pasta", images: ["food-pasta-bowl"] },
      { title: "Sourdough bagels, 6", price: 12, description: "Boiled, then baked with sesame. Freeze well.", collection: "Pantry", stock: 20, image: "food-bagels" },
      { title: "Berry pie for two", price: 16, description: "A lattice pie with summer berries and an all-butter crust.", collection: "Sweet", stock: 8, image: "food-berry-pies" },
      { title: "Pantry gift box", price: 58, description: "Chocolate, spread, pasta and cookies in a reusable box.", collection: "Gifts", stock: 14, image: "food-veg-board" },
    ],
    faqs: [
      { q: "How fresh are the baked goods?", a: "We bake on the morning of dispatch, and send them by next-day delivery." },
      { q: "Do you list allergens?", a: "Yes. Every product page lists ingredients, with allergens in bold." },
    ],
  },

  tech: {
    collections: ["Audio", "Speakers", "Accessories"],
    products: [
      { title: "Wireless headphones", price: 249, description: "Over-ear, 40 hours of battery, replaceable ear pads and cable.", collection: "Audio", option1: { name: "Colour", values: ["Chalk", "Graphite"] }, stock: 20, featured: true, image: "tech-headphones-white", images: ["tech-headphones-dark"] },
      { title: "Studio headphones", price: 189, description: "Closed-back, aluminium and leather, tuned flat for mixing.", collection: "Audio", stock: 14, featured: true, image: "tech-headphones-copper", images: ["tech-headphones-wood"] },
      { title: "Ceramic desk speaker", price: 320, description: "A glazed ceramic cabinet with a 4-inch driver and Bluetooth.", collection: "Speakers", stock: 6, featured: true, image: "tech-speaker-ceramic" },
      { title: "Pair of bookshelf speakers", price: 450, description: "Powered, with an optical input and a phono stage.", collection: "Speakers", stock: 8, featured: true, image: "tech-speakers-twin", images: ["tech-speaker-white"] },
      { title: "Pocket speaker", price: 79, description: "Water-resistant, 12 hours of playback, USB-C.", collection: "Speakers", option1: { name: "Colour", values: ["Black", "Sand"] }, stock: 30, image: "tech-speaker-black" },
      { title: "Wireless earbuds", price: 129, description: "Noise cancelling, with a charging case that lasts a week.", collection: "Audio", option1: { name: "Colour", values: ["Mint", "White"] }, stock: 25, image: "tech-earbuds-pastel" },
      { title: "Fixed-focus lens", price: 280, description: "A 35 mm f/2 lens with a metal focus ring.", collection: "Accessories", stock: 5, image: "tech-lens-dial", images: ["tech-lenses"] },
      { title: "Desk mat and stand", price: 64, description: "A felt mat and an oak stand for headphones.", collection: "Accessories", stock: 18, image: "tech-headphones-wood" },
    ],
    faqs: [
      { q: "What warranty do you offer?", a: "Two years on every product, and spare parts for at least seven." },
      { q: "Can I try before I buy?", a: "Yes. Return anything within 30 days, in its box, for a full refund." },
    ],
  },

  gadgets: {
    collections: ["Devices", "Wearables", "Accessories"],
    products: [
      { title: "Health watch", price: 299, description: "Titanium, tracks sleep and heart rate, five days of battery.", collection: "Wearables", option1: { name: "Strap", values: ["Small", "Medium", "Large"] }, stock: 30, featured: true, image: "tech-smartwatch", images: ["tech-flatlay-grey"] },
      { title: "Wooden watch", price: 145, description: "A maple case and a leather strap. Japanese quartz movement.", collection: "Wearables", stock: 12, featured: true, image: "tech-wood-watches" },
      { title: "Paper-like tablet", price: 599, description: "A calm, glare-free screen for reading and writing outdoors.", collection: "Devices", stock: 10, featured: true, image: "tech-tablet-glasses", images: ["tech-studio-desk"] },
      { title: "Desk speaker", price: 189, description: "A small speaker with a big sound and a single knob.", collection: "Devices", stock: 15, featured: true, image: "tech-speaker-white" },
      { title: "Pocket camera", price: 349, description: "A fixed-lens camera that fits in a coat pocket.", collection: "Devices", stock: 7, image: "tech-camera-wood", images: ["tech-camera-shelf"] },
      { title: "Over-ear headphones", price: 229, description: "Soft memory-foam pads and a folding headband.", collection: "Accessories", stock: 14, image: "tech-headphones-dark" },
      { title: "Charging stand", price: 49, description: "A weighted stand for your watch and phone.", collection: "Accessories", stock: 40, image: "tech-flatlay-grey" },
    ],
    faqs: [
      { q: "Which strap size should I order?", a: "Measure your wrist: under 16 cm is small, 16 to 19 cm medium, over 19 cm large." },
      { q: "Do I need a subscription?", a: "No. Every feature works without one." },
    ],
  },

  cycling: {
    collections: ["Apparel", "Components", "Accessories"],
    products: [
      { title: "Climbing jersey", price: 145, description: "A lightweight, fast-drying jersey with three rear pockets.", collection: "Apparel", option1: SZ(["XS", "S", "M", "L", "XL"]), stock: 22, featured: true, image: "sport-cyclists-city", images: ["sport-ride-hills"] },
      { title: "Thermal bib shorts", price: 210, description: "Brushed fabric, a long-ride chamois and wide bib straps.", collection: "Apparel", option1: SZ(["XS", "S", "M", "L", "XL"]), stock: 16, featured: true, image: "sport-ride-hills" },
      { title: "Bar tape", price: 32, description: "Grippy, cushioned tape in team red. Includes end plugs.", collection: "Components", stock: 40, featured: true, image: "sport-handlebar" },
      { title: "11-speed cassette", price: 89, description: "11–32 teeth, steel sprockets on an alloy carrier.", collection: "Components", stock: 12, featured: true, image: "sport-cassette" },
      { title: "Tan-wall tyres, pair", price: 96, description: "28 mm, tubeless-ready, with a supple casing.", collection: "Components", stock: 18, image: "sport-bike-tyre" },
      { title: "Steel road frame", price: 1450, description: "Hand-brazed steel, made to order in your size.", collection: "Components", stock: 3, image: "sport-bike-wall" },
      { title: "Ride cap", price: 28, description: "A cotton cap with a short peak, worn under a helmet.", collection: "Accessories", stock: 30, image: "sport-bikes-beach" },
    ],
    faqs: [
      { q: "How does your sizing compare?", a: "Our race fit is close. If you prefer a relaxed fit, take one size up." },
      { q: "Do you repair kit?", a: "Yes. Send it back and we'll repair tears and zips for free in the first year." },
    ],
  },

  ski: {
    collections: ["Skis", "Outerwear", "Accessories"],
    products: [
      { title: "All-mountain skis", price: 690, description: "A poplar core and a rockered tip for piste and powder.", collection: "Skis", option1: { name: "Length", values: ["164 cm", "171 cm", "178 cm", "184 cm"] }, stock: 10, featured: true, image: "sport-skier", images: ["sport-ski-forest"] },
      { title: "Insulated ski jacket", price: 420, description: "Waterproof shell with recycled insulation and a powder skirt.", collection: "Outerwear", option1: SZ(["S", "M", "L", "XL"]), stock: 14, featured: true, image: "sport-ski-jacket" },
      { title: "Touring skins", price: 160, description: "Mohair mix, cut to fit our touring skis.", collection: "Accessories", stock: 8, featured: true, image: "sport-ski-forest" },
      { title: "Low-light goggles", price: 145, description: "A wide lens for flat light, with a spare for sunny days.", collection: "Accessories", stock: 20, featured: true, image: "sport-chairlift" },
      { title: "Freeride skis", price: 750, description: "Wide underfoot, built for deep snow.", collection: "Skis", option1: { name: "Length", values: ["176 cm", "184 cm", "190 cm"] }, stock: 6, image: "sport-skier" },
    ],
    faqs: [
      { q: "Do you mount bindings?", a: "Yes, free with every pair of skis bought with bindings." },
      { q: "Which length should I choose?", a: "Somewhere between your chin and the top of your head. Write to us with your height and weight." },
    ],
  },

  golf: {
    collections: ["Clubs", "Apparel", "Bags"],
    products: [
      { title: "Blade putter", price: 260, description: "Milled carbon steel with a soft face insert.", collection: "Clubs", stock: 9, featured: true, image: "sport-golf-putter" },
      { title: "Driver", price: 420, description: "A forgiving 460 cc head with an adjustable loft.", collection: "Clubs", option1: { name: "Loft", values: ["9°", "10.5°", "12°"] }, stock: 7, featured: true, image: "sport-golf-driver" },
      { title: "Lightweight stand bag", price: 230, description: "Five dividers, a waterproof valuables pocket and padded straps.", collection: "Bags", stock: 12, featured: true, image: "sport-golf-bag" },
      { title: "Pique polo", price: 75, description: "Cotton piqué with a soft collar. Wears just as well off the course.", collection: "Apparel", option1: SZ(["S", "M", "L", "XL"]), stock: 30, featured: true, image: "sport-golfer" },
      { title: "Course balls, dozen", price: 48, description: "A three-piece ball with a soft feel around the greens.", collection: "Clubs", stock: 60, image: "sport-golf-course" },
    ],
    faqs: [
      { q: "Do you offer club fitting?", a: "Yes, at our studio by appointment. The fee is credited against clubs." },
      { q: "Can I return clubs I've hit?", a: "Within 14 days if they show only light wear." },
    ],
  },

  citybike: {
    collections: ["Bikes", "Parts", "Accessories"],
    products: [
      { title: "Single-speed city bike", price: 690, description: "A light steel frame, a single gear and mudguard mounts.", collection: "Bikes", option1: SZ(["S", "M", "L"]), stock: 8, featured: true, image: "sport-bike-wall", images: ["sport-bike-house"] },
      { title: "Three-speed commuter", price: 840, description: "An internal hub, a rear rack and dynamo lights.", collection: "Bikes", option1: SZ(["S", "M", "L"]), stock: 6, featured: true, image: "sport-bike-house" },
      { title: "Beach cruiser", price: 560, description: "Wide bars, a sprung saddle and a coaster brake.", collection: "Bikes", stock: 5, featured: true, image: "sport-bikes-beach" },
      { title: "Gum-wall tyres, pair", price: 72, description: "Puncture-resistant city tyres, 35 mm.", collection: "Parts", stock: 20, featured: true, image: "sport-bike-tyre" },
      { title: "Cotton bar tape", price: 18, description: "Shellac-ready cotton tape in red.", collection: "Accessories", stock: 30, image: "sport-handlebar" },
    ],
    faqs: [
      { q: "Do bikes arrive built?", a: "Ninety per cent built. Fit the pedals and bars with the tool we include, or collect from the shop fully built." },
      { q: "Do you service bikes?", a: "Yes, the first service within six months is free." },
    ],
  },

  wine: {
    collections: ["Red", "White & orange", "Glassware"],
    products: [
      { title: "Chillable red, 75 cl", price: 26, description: "Gamay from granite slopes. Light, juicy and best a little cold.", collection: "Red", stock: 24, featured: true, image: "drink-wine-bottle", images: ["drink-wine-bar"] },
      { title: "Skin-contact white, 75 cl", price: 29, description: "A week on the skins gives apricot, tea and a little grip.", collection: "White & orange", stock: 18, featured: true, image: "drink-wine-pour" },
      { title: "Mountain white, 75 cl", price: 24, description: "Crisp and saline, from a co-operative in the Alps.", collection: "White & orange", stock: 20, featured: true, image: "drink-wine-glasses" },
      { title: "Mixed case of six", price: 140, description: "Six bottles we're drinking this month, with tasting notes.", collection: "Red", stock: 10, featured: true, image: "drink-wine-bar" },
      { title: "Tasting glasses, set of 4", price: 36, description: "Thin-rimmed glasses for every style of wine.", collection: "Glassware", stock: 12, image: "drink-wine-glasses" },
    ],
    faqs: [
      { q: "What is natural wine?", a: "Wine made from organically farmed grapes with little or nothing added in the cellar." },
      { q: "Do you deliver?", a: "Yes, to adults only. The courier checks ID on delivery." },
    ],
  },

  ceramics: {
    collections: ["Tableware", "Vases", "Commissions"],
    products: [
      { title: "Stoneware dinner plate", price: 42, description: "Thrown and trimmed by hand, glazed in an oatmeal white.", collection: "Tableware", stock: 24, featured: true, image: "make-ceramics-shelf", images: ["make-potter"] },
      { title: "Everyday mug", price: 34, description: "A 350 ml mug with a thumb rest. No two are quite the same.", collection: "Tableware", option1: { name: "Glaze", values: ["Ash", "Iron", "Celadon"] }, stock: 30, featured: true, image: "make-mug-shelf" },
      { title: "Porcelain jug", price: 68, description: "A pouring jug for milk or flowers, 600 ml.", collection: "Vases", stock: 10, featured: true, image: "home-white-jug" },
      { title: "Bud vases, set of 3", price: 54, description: "Three small vases in different heights and glazes.", collection: "Vases", stock: 14, featured: true, image: "home-bud-vases" },
      { title: "Tall vase", price: 120, description: "Coil-built and burnished, about 40 cm tall.", collection: "Vases", stock: 4, image: "home-pink-vase" },
      { title: "Tableware commission", price: 450, description: "A set made for you: plates, bowls and cups in your choice of glaze.", collection: "Commissions", stock: 5, image: "make-potter" },
    ],
    faqs: [
      { q: "Is your tableware dishwasher safe?", a: "Yes, and microwave safe. Hand washing keeps the glaze bright for longer." },
      { q: "How long does a commission take?", a: "Eight to twelve weeks, depending on the kiln schedule." },
    ],
  },

  florist: {
    collections: ["Bouquets", "Plants", "Weddings"],
    products: [
      { title: "Seasonal bouquet", price: 55, description: "Whatever is best at the market this week, wrapped in paper.", collection: "Bouquets", option1: SZ(["Classic", "Generous", "Grand"]), stock: 30, featured: true, image: "make-tulips", images: ["make-flower-stall"] },
      { title: "White garden bouquet", price: 70, description: "Roses, ranunculus and greenery in whites and creams.", collection: "Bouquets", stock: 20, featured: true, image: "make-white-bouquet" },
      { title: "Tulip bunch", price: 38, description: "Twenty tulips in mixed colours, from a grower in Lincolnshire.", collection: "Bouquets", stock: 25, featured: true, image: "make-tulips-wood" },
      { title: "Snapdragons and linen", price: 48, description: "Tall snapdragons, wrapped in a reusable linen cloth.", collection: "Bouquets", stock: 15, featured: true, image: "make-snapdragons" },
      { title: "Daisy jar", price: 32, description: "Field daisies in a glass jar you can keep.", collection: "Plants", stock: 18, image: "make-daisies" },
      { title: "Wedding consultation", price: 90, description: "An hour with our wedding florist, credited against your order.", collection: "Weddings", stock: 10, image: "flower-roses" },
    ],
    faqs: [
      { q: "When will my flowers arrive?", a: "Same day in the city for orders before noon, next day everywhere else." },
      { q: "How do I keep them fresh?", a: "Trim the stems, change the water every two days and keep them away from fruit." },
    ],
  },

  woodwork: {
    collections: ["Furniture", "Objects", "Commissions"],
    products: [
      { title: "Oak stool", price: 380, description: "Solid oak with a hand-carved seat, finished in hard wax oil.", collection: "Furniture", stock: 6, featured: true, image: "home-wood-chair", images: ["make-bench"] },
      { title: "Workbench side table", price: 520, description: "Ash with through-tenons, made one at a time.", collection: "Furniture", stock: 3, featured: true, image: "make-bench" },
      { title: "Turned bowl", price: 95, description: "Turned from a single piece of walnut, about 24 cm across.", collection: "Objects", stock: 8, featured: true, image: "make-caliper" },
      { title: "Hand plane", price: 165, description: "A small block plane with a cherry body and a steel iron.", collection: "Objects", stock: 10, featured: true, image: "make-hand-plane" },
      { title: "Tool roll", price: 75, description: "Waxed canvas and leather, holds twelve chisels.", collection: "Objects", stock: 12, image: "make-apron" },
      { title: "Furniture commission", price: 1800, description: "A piece designed with you: drawings, a sample board and the finished piece.", collection: "Commissions", stock: 2, image: "make-workshop-lamps" },
    ],
    faqs: [
      { q: "What wood do you use?", a: "Oak, ash, walnut and cherry from sawmills within 100 miles of the workshop." },
      { q: "Can I visit the workshop?", a: "Yes, on the first Saturday of each month, or by appointment." },
    ],
  },

  candles: {
    collections: ["Candles", "Home scent", "Gifts"],
    products: [
      { title: "Soy candle in glass", price: 36, description: "Fig and cedar, 50 hours of burn time.", collection: "Candles", stock: 30, featured: true, image: "make-candle-jar", images: ["make-candle-shelf"] },
      { title: "Travel candle tin", price: 18, description: "A small tin of our bestselling scent, 20 hours.", collection: "Candles", stock: 40, featured: true, image: "make-candle-tin" },
      { title: "Room spray", price: 28, description: "The same scents as our candles, 100 ml.", collection: "Home scent", stock: 22, featured: true, image: "home-glass-jar" },
      { title: "Candle and vase set", price: 62, description: "A candle and a small stoneware vase in a gift box.", collection: "Gifts", stock: 12, featured: true, image: "home-bud-vases" },
    ],
    faqs: [{ q: "How do I get an even burn?", a: "Burn for two hours the first time, until the whole surface is melted." }],
  }
});


const SHOPS: ShopRow[] = [
  // Fashion and menswear
  ["e-shirting", "fashion", "Plain Weave", "One button-down, made properly, in five fabrics.", "Shirts", "Lisbon", "Portugal", "EUR", 0.9, "fashion-wooden-hangers", "Plain Weave makes one button-down pattern and refines it every season. Each piece is cut and sewn in a family workshop in northern Portugal.", "Tops & jackets"],
  ["e-knitroom", "fashion", "Wool & Water", "Knitwear made slowly in the north.", "Knitwear", "Bergen", "Norway", "NOK", 9.5, "fashion-linen-robes", "Wool & Water designs jumpers and cardigans knitted by a small mill on the west coast of Norway."],
  ["e-earthtone", "menswear", "Common Ground", "Clothes in the colours of the land.", "Menswear", "Vancouver", "Canada", "CAD", 1.3, "men-grey-knit", "Common Ground makes a small range of utility clothing in natural, undyed fibres."],
  ["e-highland", "menswear", "Glen & Fell", "Tailoring that can handle a hill walk.", "Outdoor tailoring", "Innsbruck", "Austria", "EUR", 1.05, "men-tweed-cloth", "Glen & Fell cuts jackets and trousers from mountain-weight wool, made in a tailoring workshop in Tyrol."],
  ["e-sculpt", "fashion", "Vera Stanek", "Evening dresses with a hard edge.", "Designer womenswear", "Warsaw", "Poland", "EUR", 1.2, "fashion-slip-dress", "Vera Stanek designs two collections a year, made in a studio in Warsaw from Italian silk and lace.", "Dresses"],
  ["e-whitecoat", "fashion", "Studio Nil", "Unlabelled clothes, numbered by hand.", "Designer label", "Antwerp", "Belgium", "EUR", 1.1, "fashion-boutique-rails", "Studio Nil makes garments without visible branding. Each piece carries a number stitched by hand inside the collar."],
  ["e-printshop", "fashion", "Jolly Stripe", "Bold prints for clothes and the home.", "Printed clothing", "Brooklyn", "United States", "USD", 1, "fashion-tie-top", "Jolly Stripe knits and prints its own patterns in New York, for clothes, blankets and cushions."],
  ["e-slowwear", "fashion", "Second Season", "Simple clothes, made to be worn again and again.", "Sustainable fashion", "Portland", "United States", "USD", 1, "fashion-linen-robes", "Second Season makes timeless shapes in organic fibres, and buys back worn pieces to resell or remake."],
  ["e-petal", "fashion", "Rosa Lind", "Soft dresses for summer days.", "Womenswear", "Stockholm", "Sweden", "SEK", 10.5, "fashion-floral-dress", "Rosa Lind designs floral dresses and blouses, made in small runs in Lithuania.", "Dresses"],
  ["e-silhouette", "fashion", "Form Atelier", "Sculptural clothes in quiet colours.", "Designer womenswear", "Los Angeles", "United States", "USD", 1.2, "fashion-atelier", "Form Atelier drapes every pattern on the stand before it's drafted, and makes each style in small numbers."],
  ["e-heritagebag", "bags", "Ashcombe & Co.", "Leather bags from a Somerset factory.", "Leather goods", "Somerset", "United Kingdom", "GBP", 0.85, "bag-street-handbags", "Ashcombe & Co. has made bags in the same Somerset factory for forty years, from English bridle and Italian calf leather.", "Small bags"],
  ["e-workwear", "menswear", "Dock Street", "Workwear for people who don't work in an office.", "Workwear", "Glasgow", "United Kingdom", "GBP", 0.8, "men-jacket-buttons", "Dock Street makes chore jackets, overshirts and trousers in heavy cotton, built to be repaired."],
  ["e-stripe", "fashion", "Left Bank Knits", "Striped knits from the Left Bank.", "Knitwear", "Paris", "France", "EUR", 1.1, "fashion-street", "A Parisian knitwear house known for stripes, soft jersey and black-and-white tailoring."],
  // Jewellery
  ["e-mineral", "jewellery", "Mineral Studio", "Plain gold, nothing to hide.", "Fine jewellery", "Copenhagen", "Denmark", "DKK", 7, "jewel-rings-grey", "Mineral Studio makes minimal fine jewellery in recycled gold, with prices shown by gram."],
  ["e-solid", "jewellery", "Karat Club", "Solid gold, priced fairly.", "Gold jewellery", "Melbourne", "Australia", "AUD", 1.5, "jewel-layered", "Karat Club makes solid gold chains and rings, with the gold price shown next to ours."],
  ["e-carat", "jewellery", "First Light Diamonds", "Diamonds you can trace from mine to ring.", "Diamond jewellery", "Antwerp", "Belgium", "EUR", 1.2, "jewel-solitaire-band", "First Light sells traceable diamonds, each with a record of where it was cut and polished."],
  ["e-charm", "jewellery", "Lucky Thirteen", "Charms and chains to collect.", "Charm jewellery", "Vancouver", "Canada", "CAD", 1.3, "jewel-pendant", "Lucky Thirteen makes gold-plated charms that clip on and off our chains."],
  // Furniture and home
  ["e-sunroom", "furniture", "Packwood Home", "Furniture that moves house with you.", "Modular furniture", "Detroit", "United States", "USD", 1, "home-veranda", "Packwood Home makes sofas, tables and beds that flat-pack, rebuild without tools and last through every move."],
  ["e-plywood", "furniture", "SAME DAY", "Plywood furniture, cut to order.", "Plywood furniture", "Los Angeles", "United States", "USD", 1, "home-wood-chair", "SAME DAY designs plywood furniture and cuts each piece to order on a CNC router in Los Angeles."],
  ["e-cabin", "furniture", "Pine & Pitch", "Simple furniture for small homes.", "Furniture", "Helsinki", "Finland", "EUR", 0.95, "home-white-room", "Pine & Pitch makes beds, shelves and tables in solid pine, finished with natural soap."],
  ["e-sandstone", "home", "Sandstone House", "Hand-made things for a calmer home.", "Home décor", "Jaipur", "India", "USD", 0.9, "home-pink-vase", "Sandstone House works with block printers, weavers and potters across Rajasthan."],
  ["e-claywork", "ceramics", "Clay & Kiln", "Tableware thrown by hand in Yorkshire.", "Ceramics", "Whitby", "United Kingdom", "GBP", 0.85, "make-ceramics-shelf", "Clay & Kiln is one potter and one wood-fired kiln. Everything is thrown, trimmed and glazed by hand."],
  ["e-paintbox", "home", "Paint Pot", "Paint colours that are easy to choose.", "Paint", "Brooklyn", "United States", "USD", 1, "home-red-chair", "Paint Pot makes a short list of carefully mixed colours and sends peel-and-stick swatches first."],
  ["e-colourcard", "home", "Colour Card", "Forty colours, chosen for real rooms.", "Paint", "Toronto", "Canada", "CAD", 1.35, "home-orange-armchair", "Colour Card sells forty paint colours in low-odour, washable finishes, with samples posted free."],
  ["e-hearth", "home", "Hearth & Table", "Kitchen and table things made with care.", "Homeware", "Chicago", "United States", "USD", 1, "home-kitchen", "Hearth & Table works with small makers on cookware, linens and tableware for everyday cooking."],
  ["e-darkroom", "home", "Darkroom Prints", "Photographs printed in limited editions.", "Photographic prints", "Berlin", "Germany", "EUR", 1, "home-loft", "Darkroom Prints publishes photographs by twelve photographers in numbered editions of fifty."],
  // Coffee, drinks and food
  ["e-dripper", "coffee", "Kettle & Cone Coffee", "Pour-over coffee, made slowly.", "Coffee", "Kyoto", "Japan", "JPY", 150, "coffee-pourover", "Kettle & Cone roasts light coffee for pour-over and makes ceramic drippers with a potter in Gifu."],
  ["e-roastery", "coffee", "Ninth Hour", "Coffee roasted in south London.", "Coffee roaster", "London", "United Kingdom", "GBP", 0.8, "coffee-latte-art", "Ninth Hour roasts twice a week and runs three cafés in south London."],
  ["e-flatwhite", "coffee", "SHORT BLACK", "Coffee for people who take milk.", "Coffee", "Melbourne", "Australia", "AUD", 1.5, "coffee-cortado", "SHORT BLACK roasts espresso blends that taste good with milk, and nothing else."],
  ["e-lightroast", "coffee", "Nord Roast", "Light-roasted coffee from Copenhagen.", "Coffee roaster", "Copenhagen", "Denmark", "DKK", 7, "coffee-beans", "Nord Roast buys from twelve farms and roasts light to show where each coffee comes from."],
  ["e-ranchwater", "drinks", "Prairie Fizz", "Sparkling water with lime and a kick.", "Drinks", "Austin", "United States", "USD", 1, "drink-lemon-soda", "Prairie Fizz makes sparkling drinks with real lime, inspired by long afternoons in West Texas.", "Mixers"],
  ["e-distilled", "drinks", "Fallow & Field", "Distilled, non-alcoholic spirits.", "Non-alcoholic spirits", "Bristol", "United Kingdom", "GBP", 0.8, "drink-citrus-tonic", "Fallow & Field distils botanicals one by one, then blends them into spirits without alcohol."],
  ["e-agave", "drinks", "Casa Oscura", "Tequila made from highland agave.", "Tequila", "Guadalajara", "Mexico", "USD", 1.3, "drink-pour", "Casa Oscura is a family distillery in the Jalisco highlands, cooking agave in stone ovens."],
  ["e-chutney", "food", "Spice Route Pantry", "Chutneys and pickles for every table.", "Condiments", "New York", "United States", "USD", 1, "food-spread-jar", "Spice Route makes chutneys, pickles and chilli crisp from family recipes.", "Pantry"],
  ["e-aperitivo", "drinks", "Ora d'Oro", "Aperitivo hour, bottled.", "Aperitifs", "Turin", "Italy", "EUR", 1, "drink-spritz", "Ora d'Oro makes bitter aperitifs and spritzes in a small Turin distillery."],
  ["e-snackbar", "food", "Big Cat Snacks", "Loud flavours, proper ingredients.", "Snacks", "Los Angeles", "United States", "USD", 1, "food-chocolate-berries", "Big Cat makes bold snacks and sweets with short ingredient lists.", "Sweet"],
  ["e-coldbrew", "coffee", "Spoonful Coffee", "Coffee concentrate, one spoon at a time.", "Coffee concentrate", "San Francisco", "United States", "USD", 1, "coffee-black-mug", "Spoonful makes an ultra-concentrated coffee. One spoon makes a cup, hot or iced."],
  ["e-chilioil", "food", "Hot Pot Co.", "Chilli oil with coffee in it.", "Hot sauce", "Philadelphia", "United States", "USD", 1, "food-pasta-bowl", "Hot Pot makes chilli oils and crisps, including our coffee chilli crunch.", "Pantry"],
  ["e-crunch", "food", "Fun Guy Snacks", "Crisps made from mushrooms.", "Snacks", "Seattle", "United States", "USD", 1, "food-market-crates", "Fun Guy makes crunchy snacks from mushrooms and vegetables, in flavours that taste like something.", "Sweet"],
  ["e-patisserie", "food", "Pâtisserie Brume", "Pastries and cakes from a Manhattan kitchen.", "Pâtisserie", "New York", "United States", "USD", 1.1, "food-berry-pies", "Brume bakes French pastries and seasonal cakes, delivered across Manhattan every morning.", "Sweet"],
  ["e-cookiebox", "food", "Midnight Bakehouse", "Very large cookies, baked after dark.", "Bakery", "Los Angeles", "United States", "USD", 1, "food-cookies", "Midnight Bakehouse bakes thick cookies every night and ships them in the morning.", "Sweet"],
  // Tech
  ["e-pocket", "gadgets", "Orbit Labs", "Useful gadgets in bright colours.", "Consumer tech", "Shenzhen", "China", "USD", 0.9, "tech-flatlay-grey", "Orbit Labs designs affordable tech with removable parts and colours you can swap."],
  ["e-calmscreen", "gadgets", "Slow Screen", "A tablet you can read in the sun.", "Tablets", "San Francisco", "United States", "USD", 1, "tech-studio-desk", "Slow Screen makes a paper-like tablet for reading, writing and thinking without distraction.", "Devices"],
  ["e-dial", "gadgets", "Turnkey", "Physical controls for a digital desk.", "Desk tech", "Amsterdam", "Netherlands", "EUR", 0.95, "tech-speaker-white", "Turnkey makes knobs, dials and keys that control your computer and lights.", "Devices"],
  ["e-ring", "gadgets", "Restmark Health", "Sleep and recovery, on your wrist.", "Wearables", "Helsinki", "Finland", "EUR", 1, "tech-smartwatch", "Restmark Health makes a titanium watch that tracks sleep, recovery and heart rate.", "Wearables"],
  ["e-synth", "tech", "Carry Instruments", "Instruments small enough to carry.", "Music tech", "Stockholm", "Sweden", "SEK", 10.5, "tech-studio-desk", "We design synthesisers, speakers and recorders with plain controls and long lives."],
  ["e-horizon", "tech", "Far Field Instruments", "Synths for open spaces.", "Synthesisers", "Wellington", "New Zealand", "NZD", 1.6, "tech-woofer", "Far Field makes analogue synthesisers in small batches in a workshop by the sea."],
  ["e-remade", "tech", "Second Life Audio", "Speakers made from plastic waste.", "Recycled tech", "London", "United Kingdom", "GBP", 0.8, "tech-earbuds-pastel", "Second Life Audio presses its speaker cases from household plastic waste, each one marbled differently.", "Speakers"],
  ["e-haptic", "tech", "Touchpoint", "Controllers you feel as well as hear.", "Audio controllers", "Berlin", "Germany", "EUR", 1, "tech-headphones-dark", "Touchpoint makes haptic controllers and headphones for producers and sound designers."],
  ["e-hifi", "tech", "Plinth Audio", "Hi-fi furniture and speakers.", "Hi-fi", "New York", "United States", "USD", 1.3, "tech-speakers-twin", "Plinth Audio builds speakers and hi-fi consoles in solid wood.", "Speakers"],
  // Sport
  ["e-piste", "ski", "Haute Neige", "Skis made in the Alps since 1962.", "Skis", "Grenoble", "France", "EUR", 1, "sport-skier", "Haute Neige makes skis in its own factory at the foot of the Alps."],
  ["e-climb", "cycling", "Switchback Cycling", "Cycling kit for long climbs.", "Cycling apparel", "Melbourne", "Australia", "AUD", 1.5, "sport-cyclists-city", "Switchback designs cycling kit in Melbourne for riders who go out early and come back late.", "Apparel"],
  ["e-tempo", "cycling", "Cadence & Co.", "Riding kit for every season.", "Cycling apparel", "Boulder", "United States", "USD", 1, "sport-ride-hills", "Cadence & Co. makes cycling clothes from recycled fabrics and repairs them for free.", "Apparel"],
  ["e-fairway", "golf", "Bunker Club", "Golf, without the stuffiness.", "Golf", "Sydney", "Australia", "AUD", 1.5, "sport-golfer", "Bunker Club makes golf clothes and gear for people who'd rather laugh than keep score.", "Apparel"],
  ["e-citybike", "citybike", "Slow Lane Bicycles", "Simple bikes for city streets.", "Bicycles", "Amsterdam", "Netherlands", "EUR", 0.95, "sport-bike-house", "Slow Lane makes lightweight steel bikes for short city rides, sold and serviced from our shop."],
  // Makers
  ["e-kiln", "ceramics", "Hollow Earth Pottery", "Pots for everyday use.", "Ceramics", "Asheville", "United States", "USD", 1, "make-potter", "Hollow Earth is a two-person pottery in the Blue Ridge Mountains, making tableware for daily use."],
  ["e-florist", "florist", "Bloom & Bramble", "Flowers from the market to your door.", "Florist", "Berlin", "Germany", "EUR", 1, "make-flower-stall", "Bloom & Bramble buys from local growers and delivers bouquets across the city by bicycle."],
  ["e-woodshop", "woodwork", "Grain & Joint", "Furniture made by hand in Burgundy.", "Woodwork", "Dijon", "France", "EUR", 1, "make-workshop-lamps", "Grain & Joint is a family woodworking studio, making furniture and objects from local oak."],
  ["e-studioobjects", "candles", "Still Life Objects", "Small objects for quiet rooms.", "Design objects", "Lisbon", "Portugal", "EUR", 0.95, "make-candle-shelf", "Still Life designs candles, vases and small objects, made by craftspeople around Lisbon."],
  // Four-star top-up
  ["e-cornercafe", "coffee", "Little Corner", "Your neighbourhood café, now online.", "Café", "Belgrade", "Serbia", "EUR", 0.85, "coffee-hand-cup", "Little Corner is a café on a quiet street, roasting its own beans in the back room since 2016."],
  ["e-bedside", "wellness", "Night Owl Rest", "Better sleep, one evening at a time.", "Sleep", "Brooklyn", "United States", "USD", 1, "home-cushions", "Night Owl Rest makes things for the hour before bed: eye pillows, teas and oils."],
  ["e-gutfeeling", "wellness", "Sunny Side Health", "Supplements explained in plain English.", "Supplements", "London", "United Kingdom", "GBP", 0.8, "home-glass-jar", "Sunny Side makes a short range of daily supplements and publishes the research behind each one."],
  ["e-labnotes", "wellness", "Formula Nine", "Supplements with the doses on the front.", "Supplements", "Munich", "Germany", "EUR", 1, "beauty-dropper-tan", "Formula Nine makes supplements with clinically studied doses, tested by an independent laboratory."],
  ["e-reset", "wellness", "Slow Morning Co.", "Small rituals for calmer mornings.", "Wellness", "Byron Bay", "Australia", "AUD", 1.5, "home-white-jug", "Slow Morning makes teas, oils and bath bars for a calmer start to the day."],
  ["e-mercantile", "kids", "Oak Street General", "A general store for small people.", "Children's shop", "Kansas City", "United States", "USD", 1, "kids-basket", "Oak Street General stocks toys, clothes and nursery things chosen by two parents who run the shop."],
  ["e-bobble", "kids", "Pom Pom Knits", "Warm hats for small heads.", "Children's knitwear", "Reykjavik", "Iceland", "EUR", 1, "kids-baby-feet", "Pom Pom Knits makes hats and mittens in soft wool, knitted by a cooperative in the north of Iceland."],
  ["e-isola", "kids", "Piccola Isola", "Clothes for children, made in Italy.", "Children's fashion", "Florence", "Italy", "EUR", 1, "kids-tiny-sneakers", "Piccola Isola makes clothes and shoes for babies and small children in workshops around Florence."],
  ["e-circus", "kids", "Big Top Toys", "Toys designed to last a childhood.", "Toys", "Zurich", "Switzerland", "CHF", 0.95, "kids-teddy-mobile", "Big Top designs wooden toys and nursery things with Swiss toymakers."],
  ["e-accord", "fragrance", "Maison Petrichor", "Perfume that smells like the first rain.", "Niche perfume", "Paris", "France", "EUR", 1.1, "frag-garden-portrait", "Maison Petrichor composes small-batch perfumes in Paris, with natural and safe synthetic materials."],
  ["e-crew", "streetwear", "Block Party", "Drops for the people who show up.", "Streetwear", "Amsterdam", "Netherlands", "EUR", 1, "street-hoodie-camera", "Block Party started as a weekend market stall and still makes every drop with its own community."],
  ["e-afterhours", "streetwear", "Late Shift", "Streetwear for the night.", "Streetwear", "Los Angeles", "United States", "USD", 1, "street-hood-fern", "Late Shift makes heavyweight basics and limited drops, released at midnight."],
  ["e-planner", "stationery", "Margin Notes", "Planners for people who like paper.", "Planners", "Toronto", "Canada", "CAD", 1.35, "paper-notebook-pencil", "Margin Notes designs planners and notebooks printed and bound in Toronto."],
  ["e-cheekycards", "stationery", "Rude Post", "Cards that say what you meant.", "Greetings cards", "Manchester", "United Kingdom", "GBP", 0.8, "paper-notebook-coffee", "Rude Post makes greetings cards with honest messages, printed in Manchester."],
  ["e-sparkling", "drinks", "Fizzwell", "Sparkling drinks with real fruit.", "Soft drinks", "Lisbon", "Portugal", "EUR", 0.9, "drink-lemon-soda", "Fizzwell makes lightly sparkling drinks with fruit from Portuguese orchards.", "Mixers"],
  ["e-cellar", "wine", "Low Cellar", "Natural wine, chosen by people who drink it.", "Wine shop", "Melbourne", "Australia", "AUD", 1.5, "drink-wine-pour", "Low Cellar is a small wine shop that sells low-intervention wine from growers it has visited."],
  ["e-paperfold", "ceramics", "Fold Studio", "Soft furniture and lights in folded paper.", "Design studio", "Vancouver", "Canada", "CAD", 1.35, "make-mug-shelf", "Fold Studio designs flexible paper furniture, lights and tableware in Vancouver."],
];

export const STORE3_PERSONAS: Record<string, Persona> = shopPersonas(SHOPS, { ...KITS, ...KITS2, ...KITS3 });
