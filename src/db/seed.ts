import { db } from "@/db";
import { stores, userProfiles, itemsCatalog, shoppingLists, cartItems, appSettings } from "./schema";

export async function ensureDatabaseSeeded() {
  try {
    // 1. Check user profiles
    const existingProfiles = await db.select().from(userProfiles).limit(1);
    if (existingProfiles.length === 0) {
      await db.insert(userProfiles).values({
        userName: "Shopper",
        locationCity: "Pueblo",
        locationState: "Colorado",
        locationZip: "81003",
        streetAddress: "100 Main St",
        defaultBudget: "150.00",
        preferredTheme: "dark",
        defaultCurrency: "USD",
        setupCompleted: true,
      });
    }

    // 2. Check stores
    const existingStores = await db.select().from(stores).limit(1);
    if (existingStores.length === 0) {
      const defaultStores = [
        {
          name: "Walmart Supercenter",
          chain: "Walmart",
          streetAddress: "4200 Dillon Dr",
          city: "Pueblo",
          state: "CO",
          zipCode: "81008",
          phone: "(719) 545-6600",
          stateTaxRate: "0.0290",
          countyTaxRate: "0.0100",
          cityTaxRate: "0.0370",
          specialTaxRate: "0.0000",
          isDefault: true,
          notes: "Pueblo North Walmart",
        },
        {
          name: "Sam's Club #6549",
          chain: "Sam's Club",
          streetAddress: "412 E Highway 50",
          city: "Pueblo",
          state: "CO",
          zipCode: "81008",
          phone: "(719) 542-8820",
          stateTaxRate: "0.0290",
          countyTaxRate: "0.0100",
          cityTaxRate: "0.0370",
          specialTaxRate: "0.0000",
          isDefault: false,
          notes: "Wholesale bulk club",
        },
        {
          name: "Costco Wholesale",
          chain: "Costco",
          streetAddress: "5030 N Nevada Ave",
          city: "Colorado Springs",
          state: "CO",
          zipCode: "80918",
          phone: "(719) 264-0018",
          stateTaxRate: "0.0290",
          countyTaxRate: "0.0123",
          cityTaxRate: "0.0312",
          specialTaxRate: "0.0000",
          isDefault: false,
          notes: "Costco warehouse",
        },
        {
          name: "Target Store #1842",
          chain: "Target",
          streetAddress: "3300 Dillon Dr",
          city: "Pueblo",
          state: "CO",
          zipCode: "81008",
          phone: "(719) 543-0500",
          stateTaxRate: "0.0290",
          countyTaxRate: "0.0100",
          cityTaxRate: "0.0370",
          specialTaxRate: "0.0000",
          isDefault: false,
          notes: "Target Mall area",
        },
        {
          name: "The Home Depot #1509",
          chain: "Home Depot",
          streetAddress: "4400 Dillon Dr",
          city: "Pueblo",
          state: "CO",
          zipCode: "81008",
          phone: "(719) 544-2400",
          stateTaxRate: "0.0290",
          countyTaxRate: "0.0100",
          cityTaxRate: "0.0370",
          specialTaxRate: "0.0000",
          isDefault: false,
          notes: "Hardware & Home improvement",
        },
        {
          name: "Lowe's Home Improvement #1833",
          chain: "Lowe's",
          streetAddress: "4000 Dillon Dr",
          city: "Pueblo",
          state: "CO",
          zipCode: "81008",
          phone: "(719) 544-8000",
          stateTaxRate: "0.0290",
          countyTaxRate: "0.0100",
          cityTaxRate: "0.0370",
          specialTaxRate: "0.0000",
          isDefault: false,
          notes: "Building supplies & garden",
        },
        {
          name: "Best Buy #283",
          chain: "Best Buy",
          streetAddress: "3201 Dillon Dr",
          city: "Pueblo",
          state: "CO",
          zipCode: "81008",
          phone: "(719) 545-3100",
          stateTaxRate: "0.0290",
          countyTaxRate: "0.0100",
          cityTaxRate: "0.0370",
          specialTaxRate: "0.0000",
          isDefault: false,
          notes: "Electronics & appliances",
        },
      ];

      await db.insert(stores).values(defaultStores);
    }

    // 3. Check Catalog Items
    const existingCatalog = await db.select().from(itemsCatalog).limit(1);
    if (existingCatalog.length === 0) {
      const catalogSeeds = [
        { name: "Whole Milk 1 Gallon", category: "Dairy & Eggs", department: "Grocery", regularPrice: "3.89", isTaxable: false, isFavorite: true },
        { name: "Large White Eggs (18 Count)", category: "Dairy & Eggs", department: "Grocery", regularPrice: "4.49", isTaxable: false, isFavorite: true },
        { name: "Organic Gala Apples (3 lb)", category: "Produce", department: "Grocery", regularPrice: "5.49", isTaxable: false, isFavorite: true },
        { name: "Fresh Bananas (1 lb)", category: "Produce", department: "Grocery", regularPrice: "0.68", isTaxable: false, isFavorite: true },
        { name: "Boneless Chicken Breast (2.5 lb)", category: "Meat & Seafood", department: "Meat", regularPrice: "11.99", isTaxable: false, isFavorite: true },
        { name: "Ground Beef 80/20 (1 lb)", category: "Meat & Seafood", department: "Meat", regularPrice: "5.49", isTaxable: false, isFavorite: false },
        { name: "Organic Sourdough Loaf", category: "Bakery", department: "Bakery", regularPrice: "4.29", isTaxable: false, isFavorite: false },
        { name: "Paper Towels 6 Double Rolls", category: "Household Essentials", department: "Home", regularPrice: "12.49", isTaxable: true, isFavorite: true },
        { name: "Bath Tissue 12 Mega Rolls", category: "Household Essentials", department: "Home", regularPrice: "14.49", isTaxable: true, isFavorite: false },
        { name: "Cold Brew Coffee (32 oz)", category: "Beverages", department: "Grocery", regularPrice: "7.99", isTaxable: true, isFavorite: true },
        { name: "Sparkling Water (12 pk)", category: "Beverages", department: "Grocery", regularPrice: "5.99", isTaxable: true, isFavorite: false },
        { name: "Organic Tortilla Chips", category: "Snacks & Sweets", department: "Grocery", regularPrice: "3.49", isTaxable: false, isFavorite: false },
        { name: "Multivitamin Gummies", category: "Health & Beauty", department: "Pharmacy", regularPrice: "12.99", isTaxable: true, isFavorite: false },
        { name: "AAA Batteries (16 pk)", category: "Electronics", department: "Hardware", regularPrice: "13.99", isTaxable: true, isFavorite: false },
      ];

      await db.insert(itemsCatalog).values(catalogSeeds);
    }

    // 4. Check Shopping Lists & Active Cart
    const existingLists = await db.select().from(shoppingLists).limit(1);
    if (existingLists.length === 0) {
      const storeList = await db.select().from(stores).limit(1);
      const defaultStoreId = storeList.length > 0 ? storeList[0].id : null;

      const [newList] = await db.insert(shoppingLists).values({
        name: "Weekly Family Groceries",
        storeId: defaultStoreId,
        budget: "150.00",
        isActive: true,
        isArchived: false,
        notes: "Regular weekend restocking run in Pueblo",
      }).returning();

      if (newList) {
        const initialCartItems = [
          {
            listId: newList.id,
            name: "Organic Gala Apples (3 lb)",
            category: "Produce",
            department: "Grocery",
            quantity: "1.00",
            unitPrice: "5.49",
            saleDiscount: "0.50",
            couponDiscount: "0.00",
            isTaxable: false,
            isFavorite: true,
            notes: "Crisp sweet apples",
            sortOrder: 0,
          },
          {
            listId: newList.id,
            name: "Whole Milk 1 Gallon",
            category: "Dairy & Eggs",
            department: "Grocery",
            quantity: "2.00",
            unitPrice: "3.89",
            saleDiscount: "0.00",
            couponDiscount: "0.50",
            isTaxable: false,
            isFavorite: true,
            notes: "Horizon Organic",
            sortOrder: 1,
          },
          {
            listId: newList.id,
            name: "Boneless Chicken Breasts (2.5 lb)",
            category: "Meat & Seafood",
            department: "Meat",
            quantity: "1.00",
            unitPrice: "11.99",
            saleDiscount: "2.00",
            couponDiscount: "0.00",
            isTaxable: false,
            isFavorite: false,
            notes: "Fresh butcher cut",
            sortOrder: 2,
          },
          {
            listId: newList.id,
            name: "Paper Towels 6 Double Rolls",
            category: "Household Essentials",
            department: "Home",
            quantity: "1.00",
            unitPrice: "12.49",
            saleDiscount: "1.50",
            couponDiscount: "1.00",
            isTaxable: true,
            isFavorite: true,
            notes: "Bounty Select-a-Size",
            sortOrder: 3,
          },
          {
            listId: newList.id,
            name: "Cold Brew Coffee Concentrate (32 oz)",
            category: "Beverages",
            department: "Grocery",
            quantity: "2.00",
            unitPrice: "7.99",
            saleDiscount: "1.00",
            couponDiscount: "0.00",
            isTaxable: true,
            isFavorite: true,
            notes: "Dark Roast Vanilla",
            sortOrder: 4,
          },
          {
            listId: newList.id,
            name: "Organic Sourdough Loaf",
            category: "Bakery",
            department: "Bakery",
            quantity: "1.00",
            unitPrice: "4.29",
            saleDiscount: "0.00",
            couponDiscount: "0.00",
            isTaxable: false,
            isFavorite: false,
            notes: "",
            sortOrder: 5,
          },
        ];

        await db.insert(cartItems).values(initialCartItems);
      }
    }
  } catch (error) {
    console.error("Database seed error:", error);
    throw error;
  }
}
