/**
 * This is a helper script to seed Firestore with all initial data
 * 
 * Can be used standalone or imported:
 * 1. Standalone: Run this file with Node.js: node src/utilities/seedAllData.js
 * 2. Import: Use the seedAllData exported function
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  getDocs, 
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Firebase configuration - only used when running standalone
const firebaseConfig = {
  apiKey: "AIzaSyAtTYK_FCvQnIZKUzYVFdT7AVzHep7A7jg",
  authDomain: "agrisaviya-8d38b.firebaseapp.com",
  projectId: "agrisaviya-8d38b",
  storageBucket: "agrisaviya-8d38b.appspot.com",
  messagingSenderId: "616360677214",
  appId: "1:616360677214:web:d1f81e88a83cf9c557c9cf",
  measurementId: "G-K8GDC8SJEE"
};

// Initialize Firebase
let app;
let db;

try {
  // Check if Firebase app is already initialized
  if (getApps().length > 0) {
    // Use existing app
    app = getApp();
  } else {
    // Initialize new app
    app = initializeApp(firebaseConfig);
  }
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Sample categories data
const categories = [
  {
    id: 'seeds',
    name: 'Seeds',
    icon: '🌱',
    image: 'https://www.gardeningknowhow.com/wp-content/uploads/2020/11/seed-germination.jpg'
  },
  {
    id: 'tools',
    name: 'Tools',
    icon: '🔨',
    image: 'https://cdn.shopify.com/s/files/1/0279/6466/8560/products/WhatsAppImage2023-05-31at5.02.48PM_1400x.jpg'
  },
  {
    id: 'fertilizers',
    name: 'Fertilizers',
    icon: '💧',
    image: 'https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg'
  },
  {
    id: 'pesticides',
    name: 'Pesticides',
    icon: '🐛',
    image: 'https://images.pexels.com/photos/2219219/pexels-photo-2219219.jpeg'
  },
  {
    id: 'machinery',
    name: 'Machinery',
    icon: '🚜',
    image: 'https://media.istockphoto.com/id/1320356772/photo/tractor-and-agricultural-machinery-on-the-field.jpg'
  },
  {
    id: 'irrigation',
    name: 'Irrigation',
    icon: '💦',
    image: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg'
  }
];

// Sample weather data
const weather = {
  id: 'current',
  location: 'Colombo',
  temperature: 30,
  condition: 'Sunny',
  humidity: 75,
  icon: '☀️'
};

// Sample product images
const PRODUCT_IMAGES = {
  tomatoes: 'https://images.unsplash.com/photo-1546104680-6b1f4c3f4c9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  apples: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  rice: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  milk: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  hoe: 'https://images.unsplash.com/photo-1598761438378-c699bc1fe70f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  seeds: 'https://images.unsplash.com/photo-1632165252334-385518de0567?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  fertilizer: 'https://images.unsplash.com/photo-1591995852579-a66ead20855a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  tiller: 'https://images.unsplash.com/photo-1544212575-16da38a0c0d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  carrots: 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
  bananas: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80'
};

// Sample products
const products = [
  {
    name: 'Fresh Tomatoes',
    price: 180,
    image: PRODUCT_IMAGES.tomatoes,
    description: 'Locally grown fresh tomatoes. Perfect for salads and cooking.',
    category: 'Seeds',
    rating: 4.8
  },
  {
    name: 'Organic Apples',
    price: 240,
    image: PRODUCT_IMAGES.apples,
    description: 'Sweet and juicy organic apples grown without pesticides.',
    category: 'Seeds',
    rating: 4.7
  },
  {
    name: 'Premium Rice',
    price: 560,
    image: PRODUCT_IMAGES.rice,
    description: 'High-quality rice grown in the fertile lands of Sri Lanka.',
    category: 'Seeds',
    rating: 4.9
  },
  {
    name: 'Fresh Milk',
    price: 140,
    image: PRODUCT_IMAGES.milk,
    description: 'Pure cow milk from grass-fed cows, no preservatives.',
    category: 'Seeds',
    rating: 4.6
  },
  {
    name: 'Garden Hoe',
    price: 1200,
    image: PRODUCT_IMAGES.hoe,
    description: 'High-quality garden hoe with a comfortable wooden handle.',
    category: 'Tools',
    rating: 4.5
  },
  {
    name: 'Vegetable Seeds',
    price: 350,
    image: PRODUCT_IMAGES.seeds,
    description: 'A variety of vegetable seeds for your garden. High germination rate.',
    category: 'Seeds',
    rating: 4.8
  },
  {
    name: 'Organic Fertilizer',
    price: 780,
    image: PRODUCT_IMAGES.fertilizer,
    description: 'Nutrient-rich organic fertilizer for healthier plants and soil.',
    category: 'Fertilizers',
    rating: 4.7
  },
  {
    name: 'Tiller Machine',
    price: 25000,
    image: PRODUCT_IMAGES.tiller,
    description: 'Powerful tiller machine for efficient soil preparation.',
    category: 'Machinery',
    rating: 4.9
  },
  {
    name: 'Fresh Carrots',
    price: 160,
    image: PRODUCT_IMAGES.carrots,
    description: 'Locally grown organic carrots. Rich in vitamins and antioxidants.',
    category: 'Seeds',
    rating: 4.4
  },
  {
    name: 'Organic Bananas',
    price: 90,
    image: PRODUCT_IMAGES.bananas,
    description: 'Sweet and nutritious bananas grown without chemical fertilizers.',
    category: 'Seeds',
    rating: 4.5
  }
];

// Sample articles
const articles = [
  {
    title: 'Sustainable Farming Methods',
    summary: 'Learn about modern sustainable farming techniques that improve yield while protecting the environment.',
    content: `
      Sustainable farming is becoming increasingly important in today's world. This article explores various methods that farmers can implement to make their operations more sustainable.
      
      # What is Sustainable Farming?
      
      Sustainable farming, also known as sustainable agriculture, is farming that focuses on producing long-term crops and livestock while having minimal effects on the environment. This type of farming tries to find a good balance between the need for food production and the preservation of the ecological system within the environment.
      
      # Key Sustainable Farming Methods
      
      ## 1. Crop Rotation
      
      Crop rotation involves changing the type of crops grown in a particular area each season or year. This helps to improve soil health, optimize nutrients in the soil, and combat pest and weed pressure.
      
      ## 2. Water Management
      
      Efficient water management is crucial for sustainable farming. Techniques like drip irrigation, rainwater harvesting, and planting drought-resistant crops can significantly reduce water usage.
      
      ## 3. Natural Pest Predators
      
      Encouraging natural pest predators like birds and beneficial insects can help control pest populations without the need for chemical pesticides.
      
      ## 4. Minimize Tillage
      
      Reducing tillage helps prevent soil erosion, increases water retention, and reduces carbon dioxide emissions from the soil.
      
      # Benefits of Sustainable Farming
      
      - Improved soil health and reduced erosion
      - Conservation of water and other resources
      - Reduced pollution and dependence on non-renewable energy
      - Enhanced biodiversity
      - Long-term sustainability of farm operations
      
      By adopting these sustainable farming methods, farmers can not only contribute to environmental conservation but also potentially increase their long-term productivity and profitability.
    `,
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    author: 'Dr. Sampath Perera',
    date: new Date(2023, 3, 15),
    tags: ['sustainable', 'farming', 'environment']
  },
  {
    title: 'Best Crops for Sri Lankan Climate',
    summary: 'Discover which crops thrive in Sri Lankas tropical climate and how to maximize your harvest.',
    content: `
      Sri Lanka's tropical climate provides excellent conditions for growing a variety of crops. In this article, we'll explore the best crops to grow in different regions of Sri Lanka and provide tips for successful cultivation.
      
      # Sri Lanka's Climate
      
      Sri Lanka has a tropical climate with distinct wet and dry seasons. The country can be divided into three climatic zones based on rainfall:
      
      - Wet Zone (southwestern region)
      - Intermediate Zone
      - Dry Zone (northern and eastern regions)
      
      # Top Crops for Sri Lanka
      
      ## 1. Rice
      
      Rice is the staple food in Sri Lanka and is grown in all climatic zones. The wet zone is particularly suitable for rice cultivation due to abundant rainfall.
      
      **Growing Tips:**
      - Plant at the beginning of the monsoon season
      - Ensure proper water management
      - Use appropriate varieties for your region
      
      ## 2. Tea
      
      Tea is one of Sri Lanka's major export crops and grows best in the central highlands where temperatures are cooler.
      
      **Growing Tips:**
      - Plant in well-draining soil
      - Maintain proper spacing between plants
      - Regular pruning is essential
      
      ## 3. Coconut
      
      Coconut palms thrive in the coastal areas of Sri Lanka where they receive plenty of sunlight and rainfall.
      
      **Growing Tips:**
      - Plant in sandy, well-draining soil
      - Ensure adequate spacing (7-9 meters apart)
      - Regular watering during dry periods
      
      ## 4. Vegetables
      
      A wide variety of vegetables grow well in Sri Lanka's climate, including okra, eggplant, bitter gourd, and leafy greens.
      
      **Growing Tips:**
      - Use raised beds in areas with heavy rainfall
      - Implement crop rotation
      - Consider the growing season for each vegetable
      
      # Seasonal Planting Calendar
      
      For optimal results, follow this general planting calendar:
      
      - **Yala Season (May-August)**: Rice, maize, green gram, cowpea
      - **Maha Season (September-March)**: Rice, various vegetables, pulses
      
      By selecting crops appropriate for your region and following proper cultivation practices, you can achieve successful harvests year-round in Sri Lanka's favorable climate.
    `,
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    author: 'Dr. Kumari Silva',
    date: new Date(2023, 4, 22),
    tags: ['crops', 'climate', 'cultivation']
  },
  {
    title: 'Modern Irrigation Techniques',
    summary: 'Explore the latest irrigation technologies that can help conserve water while improving crop yields.',
    content: `
      Water is a precious resource, and efficient irrigation is crucial for sustainable agriculture. This article discusses modern irrigation techniques that can help farmers use water more efficiently while improving crop production.
      
      # The Importance of Efficient Irrigation
      
      Efficient irrigation systems can:
      - Reduce water usage by 20-50%
      - Increase crop yields
      - Reduce fertilizer leaching
      - Save energy and labor costs
      
      # Modern Irrigation Techniques
      
      ## 1. Drip Irrigation
      
      Drip irrigation delivers water directly to the plant's root zone through a network of valves, pipes, tubing, and emitters.
      
      **Benefits:**
      - Uses 30-50% less water than conventional methods
      - Reduces weed growth and disease by keeping foliage dry
      - Can be automated and combined with fertigation (fertilizer application)
      
      **Best for:** Vegetables, fruit trees, vineyards, and row crops
      
      ## 2. Micro-Sprinkler Irrigation
      
      Micro-sprinklers spray water in a small area around each plant or tree.
      
      **Benefits:**
      - Covers more soil surface than drip irrigation
      - Good for sandy soils
      - Provides frost protection when needed
      
      **Best for:** Orchards, vineyards, and some field crops
      
      ## 3. Subsurface Drip Irrigation (SDI)
      
      SDI systems place drip lines below the soil surface, directly delivering water to the root zone.
      
      **Benefits:**
      - Eliminates surface evaporation
      - Reduces weed germination
      - Allows for field operations during irrigation
      
      **Best for:** Row crops in arid regions
      
      ## 4. Smart Irrigation Controls
      
      Smart irrigation controllers use weather data, soil moisture sensors, and other inputs to optimize irrigation scheduling.
      
      **Benefits:**
      - Adjusts watering based on actual plant needs
      - Can be monitored and controlled remotely
      - Reduces overwatering and runoff
      
      # Implementation Considerations
      
      When selecting an irrigation system, consider:
      - Crop type and water requirements
      - Soil characteristics
      - Water quality and availability
      - Terrain and field shape
      - Initial investment vs. long-term savings
      
      By implementing modern irrigation techniques, farmers can significantly reduce water usage while maintaining or improving crop yields, ultimately leading to more sustainable and profitable farming operations.
    `,
    image: 'https://images.unsplash.com/photo-1536435229295-aeb1c5fda986?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    author: 'Eng. Nuwan Jayawardena',
    date: new Date(2023, 5, 10),
    tags: ['irrigation', 'water', 'technology']
  }
];

// Sample market prices
const marketPrices = [
  {
    productName: 'Rice (Nadu)',
    price: 210,
    market: 'Colombo',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Rice (Samba)',
    price: 230,
    market: 'Colombo',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Tomatoes',
    price: 180,
    market: 'Colombo',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Potatoes',
    price: 250,
    market: 'Colombo',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Onions',
    price: 190,
    market: 'Colombo',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Rice (Nadu)',
    price: 200,
    market: 'Kandy',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Rice (Samba)',
    price: 220,
    market: 'Kandy',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Tomatoes',
    price: 170,
    market: 'Kandy',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Potatoes',
    price: 240,
    market: 'Kandy',
    date: new Date(2023, 6, 1)
  },
  {
    productName: 'Onions',
    price: 180,
    market: 'Kandy',
    date: new Date(2023, 6, 1)
  }
];

// Function to clear a collection
async function clearCollection(collectionName) {
  try {
    console.log(`Clearing ${collectionName} collection...`);
    const snapshot = await getDocs(collection(db, collectionName));
    
    if (snapshot.empty) {
      console.log(`Collection ${collectionName} is already empty.`);
      return true;
    }
    
    const deletePromises = [];
    let count = 0;
    
    snapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
      count++;
    });
    
    await Promise.all(deletePromises);
    console.log(`${collectionName} collection cleared! (${count} documents deleted)`);
    return true;
  } catch (error) {
    console.error(`Error clearing ${collectionName} collection:`, error);
    return false;
  }
}

// Function to add categories
async function addCategories() {
  try {
    console.log('Adding categories...');
    
    // First clear existing categories
    await clearCollection('categories');
    
    // Add new categories
    const promises = categories.map(category => 
      setDoc(doc(db, 'categories', category.id), {
        name: category.name,
        icon: category.icon,
        image: category.image,
        createdAt: serverTimestamp()
      })
    );
    
    await Promise.all(promises);
    console.log('Categories added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding categories:', error);
    return false;
  }
}

// Function to add weather data
async function addWeather() {
  try {
    console.log('Adding weather data...');
    await setDoc(doc(db, 'weather', weather.id), {
      location: weather.location,
      temperature: weather.temperature,
      condition: weather.condition,
      humidity: weather.humidity,
      icon: weather.icon,
      updatedAt: serverTimestamp()
    });
    console.log('Weather data added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding weather data:', error);
    return false;
  }
}

// Function to add products
async function addProducts() {
  try {
    console.log('Adding products...');
    
    // First clear existing products
    await clearCollection('products');
    
    // Add new products
    const promises = products.map(product => 
      addDoc(collection(db, 'products'), {
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        category: product.category,
        rating: product.rating,
        createdAt: serverTimestamp()
      })
    );
    
    await Promise.all(promises);
    console.log('Products added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding products:', error);
    return false;
  }
}

// Function to add articles
async function addArticles() {
  try {
    console.log('Adding articles...');
    
    // First clear existing articles
    await clearCollection('articles');
    
    // Add new articles
    const promises = articles.map(article => 
      addDoc(collection(db, 'articles'), {
        title: article.title,
        summary: article.summary,
        content: article.content,
        image: article.image,
        author: article.author,
        date: Timestamp.fromDate(article.date),
        tags: article.tags,
        createdAt: serverTimestamp()
      })
    );
    
    await Promise.all(promises);
    console.log('Articles added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding articles:', error);
    return false;
  }
}

// Function to add market prices
async function addMarketPrices() {
  try {
    console.log('Adding market prices...');
    
    // First clear existing market prices
    await clearCollection('marketPrices');
    
    // Add new market prices
    const promises = marketPrices.map(price => 
      addDoc(collection(db, 'marketPrices'), {
        productName: price.productName,
        price: price.price,
        market: price.market,
        date: Timestamp.fromDate(price.date),
        createdAt: serverTimestamp()
      })
    );
    
    await Promise.all(promises);
    console.log('Market prices added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding market prices:', error);
    return false;
  }
}

// Run the seeding functions
async function seedAllData() {
  try {
    console.log('Starting to seed all data...');
    
    // Track success status for each step
    const results = {
      categories: await addCategories(),
      weather: await addWeather(),
      products: await addProducts(),
      articles: await addArticles(),
      marketPrices: await addMarketPrices()
    };
    
    // Check if any step failed
    const failed = Object.entries(results).filter(([_, success]) => !success);
    
    if (failed.length > 0) {
      console.warn('Some data seeding steps failed:', failed.map(([key]) => key).join(', '));
      return false;
    }
    
    console.log('All data seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
}

// Export the function for importing in other files
export { seedAllData };

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { seedAllData };
}

// Check if running directly via Node.js
if (typeof require !== 'undefined' && require.main === module) {
  // Execute the function directly and exit process when done
  seedAllData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
} 