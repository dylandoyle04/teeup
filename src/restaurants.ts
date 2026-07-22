export interface Restaurant {
  name: string
  cuisine: string
  price: '$' | '$$' | '$$$' | '$$$$'
  rating: string
  note: string
  area: string
}

// Highly-rated restaurants near each destination's courses, keyed by the
// package `destination` string. A mix of upscale and casual so the list
// works for both luxury and value trips.
const RESTAURANTS: Record<string, Restaurant[]> = {
  "Hilton Head Island, SC": [
    { name: "The Quarterdeck", cuisine: "Lowcountry seafood", price: "$$$", rating: "4.6", note: "Rooftop oyster bar over the 18th at Harbour Town; get the Market Fish Imperial.", area: "Sea Pines / Harbour Town" },
    { name: "Skull Creek Boathouse", cuisine: "Waterfront seafood & sushi", price: "$$", rating: "4.5", note: "Lively marina spot with sunset views, fresh seafood, and creative sushi rolls.", area: "Hilton Head Island" },
    { name: "Nectar Farm Kitchen", cuisine: "Farm-to-table Southern", price: "$$$", rating: "4.5", note: "Old Town farm-to-table; go for the braised short rib or chicken and waffles.", area: "Bluffton" },
    { name: "The Cottage", cuisine: "Southern cafe & brunch", price: "$$", rating: "4.5", note: "Charming historic-district cafe famed for its shrimp and grits.", area: "Bluffton" },
  ],
  "Boyne, MI": [
    { name: "Chandler's", cuisine: "New American / wine cellar", price: "$$$$", rating: "4.5", note: "Chef-driven seasonal menu; get the crab cakes in the wine cellar.", area: "Petoskey" },
    { name: "Palette Bistro", cuisine: "Mediterranean small plates", price: "$$$", rating: "4.5", note: "Brick-oven plates and Little Traverse Bay views from the upper deck.", area: "Petoskey" },
    { name: "Pond Hill Farm (Garden Cafe)", cuisine: "Farm-to-table / wood-fired pizza", price: "$$", rating: "4.6", note: "Rustic farm cafe with wood-fired pizzas, on-site winery and brewery.", area: "Harbor Springs" },
    { name: "Roast & Toast", cuisine: "Cafe / breakfast & lunch", price: "$", rating: "4.5", note: "House-roasted coffee, scratch bakery, and great breakfast sandwiches.", area: "Petoskey" },
  ],
  "Las Vegas, NV": [
    { name: "Bavette's Steakhouse & Bar", cuisine: "Steakhouse", price: "$$$$", rating: "4.3", note: "Old-school moody steakhouse; order the dry-aged ribeye and bone marrow.", area: "The Strip" },
    { name: "Gordon Ramsay Hell's Kitchen", cuisine: "British / American", price: "$$$", rating: "4.2", note: "Celebrity-chef spectacle at Caesars; the Beef Wellington is a must.", area: "The Strip" },
    { name: "Aburiya Raku", cuisine: "Japanese izakaya", price: "$$", rating: "4.6", note: "Charcoal-grilled small plates where the chefs eat late; great value.", area: "Chinatown" },
    { name: "Lotus of Siam", cuisine: "Northern Thai", price: "$$", rating: "4.4", note: "James Beard-winning Thai; get the crispy duck and khao soi.", area: "Chinatown" },
  ],
  "Orlando, FL": [
    { name: "Chef's Table at the Edgewater", cuisine: "New American prix-fixe", price: "$$$$", rating: "4.6", note: "Golden Spoon tasting menu; try the pomme pavé and short rib.", area: "Winter Garden" },
    { name: "DOMU", cuisine: "Japanese ramen", price: "$$", rating: "4.6", note: "Orlando's best ramen and wings; order the Richie Rich.", area: "Dr. Phillips" },
    { name: "Chef Art Smith's Homecomin'", cuisine: "Southern comfort", price: "$$", rating: "4.4", note: "Famous fried chicken and moonshine cocktails in a farmhouse setting.", area: "Disney Springs" },
    { name: "The Boathouse", cuisine: "Seafood & steak", price: "$$$", rating: "4.5", note: "Waterfront dining with fresh seafood, prime steaks, and amphicar rides.", area: "Disney Springs" },
  ],
  "San Diego, CA": [
    { name: "NINE-TEN", cuisine: "California / seafood", price: "$$$$", rating: "4.5", note: "Michelin-recognized La Jolla tasting menu; go for the chef's tasting.", area: "La Jolla" },
    { name: "Shorehouse Kitchen", cuisine: "Breakfast & brunch", price: "$$", rating: "4.6", note: "Sunny casual brunch spot; famous for the crab cake benedict.", area: "Carlsbad" },
    { name: "Carvers Steaks & Chops", cuisine: "Steakhouse / prime rib", price: "$$$", rating: "4.4", note: "North County's classic steakhouse; order the award-winning prime rib.", area: "Rancho Bernardo" },
    { name: "Marinade on Main", cuisine: "Farm-to-table American", price: "$$", rating: "4.6", note: "Great-value Ramona spot; the fried chicken is a must.", area: "Ramona" },
  ],
  "Scottsdale, AZ": [
    { name: "Mastro's Steakhouse", cuisine: "Steakhouse & seafood", price: "$$$$", rating: "4.6", note: "Named among AZ's best; go for USDA Prime and the butter cake.", area: "North Scottsdale" },
    { name: "The Mission", cuisine: "Modern Latin", price: "$$$", rating: "4.5", note: "Order the tableside guacamole and wood-grilled meats; elegant vibe.", area: "Kierland" },
    { name: "Culinary Dropout", cuisine: "New American gastropub", price: "$$", rating: "4.4", note: "Fun, lively spot; famous soft pretzels and 36-hour braised ribs.", area: "North Scottsdale" },
    { name: "Postino", cuisine: "Wine cafe & bruschetta", price: "$$", rating: "4.4", note: "Great-value bruschetta boards and a killer wine happy hour.", area: "Kierland" },
  ],
  "Palm Springs, CA": [
    { name: "Morgan's in the Desert", cuisine: "Contemporary American", price: "$$$$", rating: "4.5", note: "Produce-driven seasonal plates and prime steaks at La Quinta Resort.", area: "La Quinta" },
    { name: "Arnold Palmer's Restaurant", cuisine: "Steakhouse", price: "$$$", rating: "4.4", note: "Prime steaks and famous meatloaf on the mountain-view patio.", area: "La Quinta" },
    { name: "Bar Issi", cuisine: "Italian", price: "$$$", rating: "4.5", note: "Wood-fired pizzas, housemade pasta, and caviar service.", area: "Palm Springs" },
    { name: "Adobe Grill", cuisine: "Mexican", price: "$$", rating: "4.3", note: "Tableside guacamole and Oaxacan mole with margaritas.", area: "La Quinta" },
  ],
  "Naples, FL": [
    { name: "Sails Restaurant", cuisine: "Seafood & steak", price: "$$$$", rating: "4.6", note: "Elegant fine dining with a raw bar in downtown Naples.", area: "Naples" },
    { name: "The Turtle Club", cuisine: "Seafood", price: "$$$", rating: "4.5", note: "Beachfront dining with Gulf sunsets and fresh catch.", area: "Naples" },
    { name: "Campiello", cuisine: "Italian", price: "$$$", rating: "4.5", note: "Lively Fifth Avenue trattoria with wood-fired dishes.", area: "Naples" },
    { name: "Pinchers", cuisine: "Casual seafood", price: "$$", rating: "4.3", note: "Laid-back local favorite for crab, shrimp, and cold beer.", area: "Fort Myers" },
  ],
  "Pinehurst, NC": [
    { name: "Ashten's", cuisine: "Farm-to-table American", price: "$$$", rating: "4.6", note: "Elegant Southern Pines room with local ingredients and a cozy pub.", area: "Southern Pines" },
    { name: "Southern Prime Steakhouse", cuisine: "Steakhouse", price: "$$$$", rating: "4.7", note: "Relaxed, upscale steaks with polished service in Southern Pines.", area: "Southern Pines" },
    { name: "Villaggio Ristorante", cuisine: "Italian", price: "$$$", rating: "4.5", note: "House-made pastas inside Pinehurst's historic Magnolia Inn.", area: "Pinehurst" },
    { name: "Drum & Quill Public House", cuisine: "Gastropub", price: "$$", rating: "4.5", note: "Cozy Old Town pub with modern fare and live music.", area: "Pinehurst" },
  ],
  "Charleston, SC": [
    { name: "FIG", cuisine: "Southern / seasonal", price: "$$$", rating: "4.7", note: "James Beard-winning farm-to-table cornerstone of downtown dining.", area: "Downtown Charleston" },
    { name: "Halls Chophouse", cuisine: "Steakhouse", price: "$$$$", rating: "4.8", note: "Charleston's signature upscale steak and martini destination.", area: "Downtown Charleston" },
    { name: "Leon's Oyster Shop", cuisine: "Seafood / fried chicken", price: "$$", rating: "4.6", note: "Casual former garage famous for oysters and fried chicken.", area: "Downtown Charleston" },
    { name: "Rodney Scott's BBQ", cuisine: "Barbecue", price: "$$", rating: "4.6", note: "Whole-hog pitmaster and James Beard winner, deliciously casual.", area: "Downtown Charleston" },
  ],
  "Myrtle Beach, SC": [
    { name: "Bistro 217", cuisine: "New American / seafood", price: "$$$", rating: "4.7", note: "Pawleys favorite near Caledonia; go for the fresh seafood and desserts.", area: "Pawleys Island" },
    { name: "Hook & Barrel", cuisine: "Modern Lowcountry seafood", price: "$$$", rating: "4.7", note: "Sleek seafood standout; order the bourbon bacon and she-crab soup.", area: "Myrtle Beach" },
    { name: "New York Prime", cuisine: "Steakhouse", price: "$$$$", rating: "4.4", note: "USDA prime aged beef and colossal shrimp for the splurge dinner.", area: "Myrtle Beach" },
    { name: "Flying Fish Public Market & Grill", cuisine: "Casual seafood / raw bar", price: "$$", rating: "4.5", note: "Barefoot Landing raw bar; great-value steamed shellfish and sushi.", area: "North Myrtle Beach" },
  ],
}

/** OpenTable reservation search for a restaurant (falls back to results for
 *  the name + city if the exact spot isn't bookable on OpenTable). */
export function reserveLink(r: Restaurant, destination: string): string {
  const city = destination.split(',')[0]
  const q = `${r.name} ${city}`
  return `https://www.opentable.com/s?term=${encodeURIComponent(q)}`
}

/** Google Maps search link for a restaurant (secondary, for directions). */
export function mapsLink(r: Restaurant, destination: string): string {
  const city = destination.split(',')[0]
  const q = `${r.name} ${r.area} ${city}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function getRestaurants(destination: string): Restaurant[] {
  return RESTAURANTS[destination] ?? []
}
