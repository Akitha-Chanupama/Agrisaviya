import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { 
  Product, 
  Category, 
  Weather, 
  Article, 
  MarketPrice, 
  User, 
  Order, 
  Review,
  Bid,
  BidOffer,
  Shop,
  Machine
} from '../types';
import { getRandomId } from '../utils';

/*** CATEGORIES ***/

// Get all categories
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categoriesCollection = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesCollection);
    
    const categoriesData: Category[] = [];
    categoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      categoriesData.push({
        id: doc.id,
        name: data.name || '',
        icon: data.icon || '',
        image: data.image || ''
      });
    });
    
    return categoriesData;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (categoryId: string): Promise<Category | null> => {
  try {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    
    if (categoryDoc.exists()) {
      const data = categoryDoc.data();
      return {
        id: categoryDoc.id,
        name: data.name || '',
        icon: data.icon || '',
        image: data.image || ''
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting category by ID:', error);
    throw error;
  }
};

/*** PRODUCTS ***/

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    
    const productsData: Product[] = [];
    productsSnapshot.forEach((doc) => {
      const data = doc.data();
      productsData.push({
        id: doc.id,
        name: data.name || '',
        price: data.price || 0,
        image: data.image || '',
        description: data.description || '',
        category: data.category || '',
        rating: data.rating || 0
      });
    });
    
    return productsData;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (categoryName: string): Promise<Product[]> => {
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, where('category', '==', categoryName));
    const productsSnapshot = await getDocs(q);
    
    const productsData: Product[] = [];
    productsSnapshot.forEach((doc) => {
      const data = doc.data();
      productsData.push({
        id: doc.id,
        name: data.name || '',
        price: data.price || 0,
        image: data.image || '',
        description: data.description || '',
        category: data.category || '',
        rating: data.rating || 0
      });
    });
    
    return productsData;
  } catch (error) {
    console.error(`Error getting products by category: ${categoryName}`, error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId));
    
    if (productDoc.exists()) {
      const data = productDoc.data();
      return {
        id: productDoc.id,
        name: data.name || '',
        price: data.price || 0,
        image: data.image || '',
        description: data.description || '',
        category: data.category || '',
        rating: data.rating || 0
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error;
  }
};

// Get featured products
export const getFeaturedProducts = async (limitNum: number = 4): Promise<Product[]> => {
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('rating', 'desc'), limit(limitNum));
    const productsSnapshot = await getDocs(q);
    
    const productsData: Product[] = [];
    productsSnapshot.forEach((doc) => {
      const data = doc.data();
      productsData.push({
        id: doc.id,
        name: data.name || '',
        price: data.price || 0,
        image: data.image || '',
        description: data.description || '',
        category: data.category || '',
        rating: data.rating || 0
      });
    });
    
    return productsData;
  } catch (error) {
    console.error('Error getting featured products:', error);
    throw error;
  }
};

/*** WEATHER ***/

// Get current weather
export const getCurrentWeather = async (): Promise<Weather | null> => {
  try {
    const weatherDoc = await getDoc(doc(db, 'weather', 'current'));
    
    if (weatherDoc.exists()) {
      const data = weatherDoc.data();
      return {
        location: data.location || '',
        temperature: data.temperature || 0,
        condition: data.condition || '',
        humidity: data.humidity || 0,
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting current weather:', error);
    throw error;
  }
};

// Get weather for multiple locations
export const getAllWeather = async (): Promise<Weather[]> => {
  try {
    const weatherCollection = collection(db, 'weather');
    const weatherSnapshot = await getDocs(weatherCollection);
    
    const weatherData: Weather[] = [];
    weatherSnapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id !== 'current') { // Skip the current weather doc
        weatherData.push({
          location: data.location || '',
          temperature: data.temperature || 0,
          condition: data.condition || '',
          humidity: data.humidity || 0,
          date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
        });
      }
    });
    
    return weatherData;
  } catch (error) {
    console.error('Error getting all weather:', error);
    throw error;
  }
};

/*** ARTICLES ***/

// Get all articles
export const getAllArticles = async (): Promise<Article[]> => {
  try {
    const articlesCollection = collection(db, 'articles');
    const q = query(articlesCollection, orderBy('date', 'desc'));
    const articlesSnapshot = await getDocs(q);
    
    const articlesData: Article[] = [];
    articlesSnapshot.forEach((doc) => {
      const data = doc.data();
      articlesData.push({
        id: doc.id,
        title: data.title || '',
        summary: data.summary || '',
        content: data.content || '',
        image: data.image || '',
        author: data.author || '',
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
        tags: data.tags || []
      });
    });
    
    return articlesData;
  } catch (error) {
    console.error('Error getting articles:', error);
    throw error;
  }
};

// Get article by ID
export const getArticleById = async (articleId: string): Promise<Article | null> => {
  try {
    const articleDoc = await getDoc(doc(db, 'articles', articleId));
    
    if (articleDoc.exists()) {
      const data = articleDoc.data();
      return {
        id: articleDoc.id,
        title: data.title || '',
        summary: data.summary || '',
        content: data.content || '',
        image: data.image || '',
        author: data.author || '',
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
        tags: data.tags || []
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting article by ID:', error);
    throw error;
  }
};

// Get articles by tag
export const getArticlesByTag = async (tag: string): Promise<Article[]> => {
  try {
    const articlesCollection = collection(db, 'articles');
    const q = query(articlesCollection, where('tags', 'array-contains', tag), orderBy('date', 'desc'));
    const articlesSnapshot = await getDocs(q);
    
    const articlesData: Article[] = [];
    articlesSnapshot.forEach((doc) => {
      const data = doc.data();
      articlesData.push({
        id: doc.id,
        title: data.title || '',
        summary: data.summary || '',
        content: data.content || '',
        image: data.image || '',
        author: data.author || '',
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
        tags: data.tags || []
      });
    });
    
    return articlesData;
  } catch (error) {
    console.error(`Error getting articles by tag: ${tag}`, error);
    throw error;
  }
};

/*** MARKET PRICES ***/

// Get all market prices
export const getAllMarketPrices = async (): Promise<MarketPrice[]> => {
  try {
    const marketPricesCollection = collection(db, 'marketPrices');
    const q = query(marketPricesCollection, orderBy('date', 'desc'));
    const marketPricesSnapshot = await getDocs(q);
    
    const marketPricesData: MarketPrice[] = [];
    marketPricesSnapshot.forEach((doc) => {
      const data = doc.data();
      marketPricesData.push({
        id: doc.id,
        productName: data.productName || '',
        price: data.price || 0,
        market: data.market || '',
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
      });
    });
    
    return marketPricesData;
  } catch (error) {
    console.error('Error getting market prices:', error);
    throw error;
  }
};

// Get market prices by market
export const getMarketPricesByMarket = async (marketName: string): Promise<MarketPrice[]> => {
  try {
    const marketPricesCollection = collection(db, 'marketPrices');
    const q = query(marketPricesCollection, where('market', '==', marketName), orderBy('date', 'desc'));
    const marketPricesSnapshot = await getDocs(q);
    
    const marketPricesData: MarketPrice[] = [];
    marketPricesSnapshot.forEach((doc) => {
      const data = doc.data();
      marketPricesData.push({
        id: doc.id,
        productName: data.productName || '',
        price: data.price || 0,
        market: data.market || '',
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
      });
    });
    
    return marketPricesData;
  } catch (error) {
    console.error(`Error getting market prices by market: ${marketName}`, error);
    throw error;
  }
};

/*** USERS ***/

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: userDoc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        avatar: data.avatar || '',
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...userData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/*** ORDERS ***/

// Get orders for a user
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(ordersCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const ordersSnapshot = await getDocs(q);
    
    const ordersData: Order[] = [];
    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      ordersData.push({
        id: doc.id,
        userId: data.userId || '',
        products: data.products || [],
        totalAmount: data.totalAmount || 0,
        status: data.status || 'processing',
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date(),
      });
    });
    
    return ordersData;
  } catch (error) {
    console.error(`Error getting orders for user: ${userId}`, error);
    throw error;
  }
};

// Create a new order
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const orderCollection = collection(db, 'orders');
    const newOrder = {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(orderCollection, newOrder);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/*** REVIEWS ***/

// Get reviews for a product
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    const reviewsCollection = collection(db, 'reviews');
    const q = query(reviewsCollection, where('productId', '==', productId), orderBy('date', 'desc'));
    const reviewsSnapshot = await getDocs(q);
    
    const reviewsData: Review[] = [];
    reviewsSnapshot.forEach((doc) => {
      const data = doc.data();
      reviewsData.push({
        id: doc.id,
        productId: data.productId || '',
        userId: data.userId || '',
        userName: data.userName || '',
        rating: data.rating || 0,
        text: data.text || '',
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
      });
    });
    
    return reviewsData;
  } catch (error) {
    console.error(`Error getting reviews for product: ${productId}`, error);
    throw error;
  }
};

// Add a review
export const addReview = async (reviewData: Omit<Review, 'id' | 'date'>): Promise<string> => {
  try {
    const reviewsCollection = collection(db, 'reviews');
    const newReview = {
      ...reviewData,
      date: serverTimestamp()
    };
    
    const docRef = await addDoc(reviewsCollection, newReview);
    return docRef.id;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

// Utility function to seed products from mock data
export const seedProductsCollection = async (products: Product[]): Promise<void> => {
  try {
    console.log('Adding products...');
    
    const batch = products.map(product => 
      addDoc(collection(db, 'products'), {
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        category: product.category,
        rating: product.rating
      })
    );
    
    await Promise.all(batch);
    console.log('Products added successfully!');
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
};

// Utility function to seed articles from mock data
export const seedArticlesCollection = async (articles: Article[]): Promise<void> => {
  try {
    console.log('Adding articles...');
    
    const batch = articles.map(article => 
      addDoc(collection(db, 'articles'), {
        title: article.title,
        summary: article.summary,
        content: article.content,
        image: article.image,
        author: article.author,
        date: Timestamp.fromDate(article.date),
        tags: article.tags
      })
    );
    
    await Promise.all(batch);
    console.log('Articles added successfully!');
  } catch (error) {
    console.error('Error seeding articles:', error);
    throw error;
  }
};

// Utility function to seed market prices from mock data
export const seedMarketPricesCollection = async (marketPrices: MarketPrice[]): Promise<void> => {
  try {
    console.log('Adding market prices...');
    
    const batch = marketPrices.map(price => 
      addDoc(collection(db, 'marketPrices'), {
        productName: price.productName,
        price: price.price,
        market: price.market,
        date: Timestamp.fromDate(price.date)
      })
    );
    
    await Promise.all(batch);
    console.log('Market prices added successfully!');
  } catch (error) {
    console.error('Error seeding market prices:', error);
    throw error;
  }
};

/*** BIDS ***/

// Add a new bid
export const addBid = async (bidData: Omit<Bid, 'id'>): Promise<string> => {
  try {
    const bidsCollection = collection(db, 'bids');
    const newBid = {
      ...bidData,
      startDate: Timestamp.fromDate(bidData.startDate),
      dueDate: Timestamp.fromDate(bidData.dueDate),
      createdAt: serverTimestamp(),
      status: 'active',
      bids: []
    };
    
    const docRef = await addDoc(bidsCollection, newBid);
    return docRef.id;
  } catch (error) {
    console.error('Error adding bid:', error);
    throw error;
  }
};

// Get all bids
export const getAllBids = async (): Promise<Bid[]> => {
  try {
    const bidsCollection = collection(db, 'bids');
    const q = query(bidsCollection, orderBy('createdAt', 'desc'));
    const bidsSnapshot = await getDocs(q);
    
    const bidsData: Bid[] = [];
    bidsSnapshot.forEach((doc) => {
      const data = doc.data();
      bidsData.push({
        id: doc.id,
        name: data.name || '',
        number: data.number || '',
        category: data.category || '',
        item: data.item || '',
        description: data.description || '',
        startPrice: data.startPrice || 0,
        startDate: data.startDate ? new Date(data.startDate.seconds * 1000) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate.seconds * 1000) : new Date(),
        email: data.email || '',
        imageUri: data.imageUri || '',
        status: data.status || 'active',
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        bids: data.bids || []
      });
    });
    
    return bidsData;
  } catch (error) {
    console.error('Error getting bids:', error);
    throw error;
  }
};

// Get active bids for display on home screen
export const getActiveBids = async (limitCount: number = 4): Promise<Bid[]> => {
  try {
    const bidsCollection = collection(db, 'bids');
    const q = query(
      bidsCollection, 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const bidsSnapshot = await getDocs(q);
    
    const bidsData: Bid[] = [];
    bidsSnapshot.forEach((doc) => {
      const data = doc.data();
      bidsData.push({
        id: doc.id,
        name: data.name || '',
        number: data.number || '',
        category: data.category || '',
        item: data.item || '',
        description: data.description || '',
        startPrice: data.startPrice || 0,
        startDate: data.startDate ? new Date(data.startDate.seconds * 1000) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate.seconds * 1000) : new Date(),
        email: data.email || '',
        imageUri: data.imageUri || '',
        status: data.status || 'active',
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        bids: data.bids || []
      });
    });
    
    return bidsData;
  } catch (error) {
    console.error('Error getting active bids:', error);
    throw error;
  }
};

// Get bid by ID
export const getBidById = async (bidId: string): Promise<Bid | null> => {
  try {
    const bidDoc = await getDoc(doc(db, 'bids', bidId));
    
    if (bidDoc.exists()) {
      const data = bidDoc.data();
      return {
        id: bidDoc.id,
        name: data.name || '',
        number: data.number || '',
        category: data.category || '',
        item: data.item || '',
        description: data.description || '',
        startPrice: data.startPrice || 0,
        startDate: data.startDate ? new Date(data.startDate.seconds * 1000) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate.seconds * 1000) : new Date(),
        email: data.email || '',
        imageUri: data.imageUri || '',
        status: data.status || 'active',
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        bids: data.bids || []
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting bid by ID:', error);
    throw error;
  }
};

// Get bids by user's email
export const getBidsByEmail = async (email: string): Promise<Bid[]> => {
  try {
    const bidsCollection = collection(db, 'bids');
    const q = query(
      bidsCollection, 
      where('email', '==', email),
      orderBy('createdAt', 'desc')
    );
    const bidsSnapshot = await getDocs(q);
    
    const bidsData: Bid[] = [];
    bidsSnapshot.forEach((doc) => {
      const data = doc.data();
      bidsData.push({
        id: doc.id,
        name: data.name || '',
        number: data.number || '',
        category: data.category || '',
        item: data.item || '',
        description: data.description || '',
        startPrice: data.startPrice || 0,
        startDate: data.startDate ? new Date(data.startDate.seconds * 1000) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate.seconds * 1000) : new Date(),
        email: data.email || '',
        imageUri: data.imageUri || '',
        status: data.status || 'active',
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        bids: data.bids || []
      });
    });
    
    return bidsData;
  } catch (error) {
    console.error('Error getting bids by email:', error);
    throw error;
  }
};

// Place a new bid on an item
export const placeBidOffer = async (
  bidId: string,
  bidOffer: Omit<BidOffer, 'id' | 'bidId' | 'createdAt'>
): Promise<string> => {
  try {
    // First get the current bid document
    const bidDocRef = doc(db, 'bids', bidId);
    const bidDoc = await getDoc(bidDocRef);
    
    if (!bidDoc.exists()) {
      throw new Error('Bid not found');
    }
    
    const bidData = bidDoc.data();
    
    // Check if bid is still active
    if (bidData.status !== 'active') {
      throw new Error('This bid is no longer active');
    }
    
    // Check if due date has passed
    const dueDate = new Date(bidData.dueDate.seconds * 1000);
    if (dueDate < new Date()) {
      throw new Error('The bidding period for this item has ended');
    }
    
    // Generate a new bid ID
    const newBidOfferId = String(Date.now());
    
    // Create the new bid offer
    const newBidOffer: BidOffer = {
      id: newBidOfferId,
      bidId: bidId,
      amount: bidOffer.amount,
      email: bidOffer.email,
      createdAt: new Date()
    };
    
    // Add to the bids array
    const currentBids = bidData.bids || [];
    const updatedBids = [...currentBids, newBidOffer];
    
    // Update the document
    await updateDoc(bidDocRef, {
      bids: updatedBids
    });
    
    return newBidOfferId;
  } catch (error) {
    console.error('Error placing bid offer:', error);
    throw error;
  }
};

// Shop Functions
export const getAllShops = async (): Promise<Shop[]> => {
  try {
    const shopsCollection = collection(db, 'shops');
    const shopsSnapshot = await getDocs(shopsCollection);
    
    if (shopsSnapshot.empty) {
      console.log('No shops found');
      return [];
    }
    
    const shops: Shop[] = [];
    shopsSnapshot.forEach((doc) => {
      const shopData = doc.data();
      shops.push({
        id: doc.id,
        name: shopData.name,
        categoryId: shopData.categoryId,
        owner: shopData.owner,
        phone: shopData.phone,
        whatsapp: shopData.whatsapp,
        address: shopData.address,
        description: shopData.description,
        image: shopData.image,
        products: shopData.products || [],
        location: shopData.location,
      });
    });
    
    return shops;
  } catch (error) {
    console.error('Error getting shops:', error);
    throw error;
  }
};

export const getShopsByCategory = async (categoryId: string): Promise<Shop[]> => {
  try {
    const shopsCollection = collection(db, 'shops');
    const q = query(shopsCollection, where('categoryId', '==', categoryId));
    const shopsSnapshot = await getDocs(q);
    
    if (shopsSnapshot.empty) {
      console.log(`No shops found for category ${categoryId}`);
      return [];
    }
    
    const shops: Shop[] = [];
    shopsSnapshot.forEach((doc) => {
      const shopData = doc.data();
      shops.push({
        id: doc.id,
        name: shopData.name,
        categoryId: shopData.categoryId,
        owner: shopData.owner,
        phone: shopData.phone,
        whatsapp: shopData.whatsapp,
        address: shopData.address,
        description: shopData.description,
        image: shopData.image,
        products: shopData.products || [],
        location: shopData.location,
      });
    });
    
    return shops;
  } catch (error) {
    console.error(`Error getting shops for category ${categoryId}:`, error);
    throw error;
  }
};

export const getShopById = async (shopId: string): Promise<Shop> => {
  try {
    const shopRef = doc(db, 'shops', shopId);
    const shopSnapshot = await getDoc(shopRef);
    
    if (!shopSnapshot.exists()) {
      throw new Error(`Shop with ID ${shopId} not found`);
    }
    
    const shopData = shopSnapshot.data();
    return {
      id: shopSnapshot.id,
      name: shopData.name,
      categoryId: shopData.categoryId,
      owner: shopData.owner,
      phone: shopData.phone,
      whatsapp: shopData.whatsapp || shopData.phone,
      address: shopData.address,
      description: shopData.description,
      image: shopData.image,
      products: shopData.products || [],
      location: shopData.location,
    };
  } catch (error) {
    console.error(`Error getting shop with ID ${shopId}:`, error);
    throw error;
  }
};

export const getShopProducts = async (shopId: string): Promise<Product[]> => {
  try {
    const shop = await getShopById(shopId);
    
    if (!shop.products || shop.products.length === 0) {
      return [];
    }
    
    const products: Product[] = [];
    for (const productId of shop.products) {
      try {
        const product = await getProductById(productId);
        if (product) {
          products.push(product);
        }
      } catch (error) {
        console.error(`Error getting product ${productId}:`, error);
      }
    }
    
    return products;
  } catch (error) {
    console.error(`Error getting products for shop ${shopId}:`, error);
    throw error;
  }
};

export const addShop = async (shopData: Omit<Shop, 'id'>): Promise<string> => {
  try {
    const shopsCollection = collection(db, 'shops');
    const docRef = await addDoc(shopsCollection, {
      ...shopData,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding shop:', error);
    throw error;
  }
};

export const updateShop = async (shopId: string, shopData: Partial<Shop>): Promise<void> => {
  try {
    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, {
      ...shopData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating shop ${shopId}:`, error);
    throw error;
  }
};

export const addProductToShop = async (shopId: string, productId: string): Promise<void> => {
  try {
    const shopRef = doc(db, 'shops', shopId);
    const shopSnapshot = await getDoc(shopRef);
    
    if (!shopSnapshot.exists()) {
      throw new Error(`Shop with ID ${shopId} not found`);
    }
    
    const shopData = shopSnapshot.data();
    const products = shopData.products || [];
    
    if (!products.includes(productId)) {
      await updateDoc(shopRef, {
        products: [...products, productId],
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error(`Error adding product ${productId} to shop ${shopId}:`, error);
    throw error;
  }
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
  try {
    const productsCollection = collection(db, 'products');
    const docRef = await addDoc(productsCollection, {
      ...productData,
      createdAt: serverTimestamp(),
    });
    
    // If shopId is provided, add this product to the shop
    if (productData.shopId) {
      await addProductToShop(productData.shopId, docRef.id);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const seedShopsCollection = async (): Promise<void> => {
  try {
    const shopsRef = collection(db, 'shops');
    
    const sampleShops = [
      {
        id: getRandomId(),
        name: 'Organic Farm Supplies',
        image: 'https://source.unsplash.com/random/400x200/?farm',
        description: 'We supply high-quality organic farming equipment and supplies.',
        address: '123 Green Lane, Colombo',
        phone: '+94 77 123 4567',
        email: 'info@organicfarm.lk',
        categoryId: 'category_seeds',
        products: [],
        rating: 4.5,
        reviews: 24,
        openingHours: '8:00 AM - 6:00 PM',
        location: {
          latitude: 6.9271,
          longitude: 79.8612
        }
      },
      {
        id: getRandomId(),
        name: 'Farm Tech Solutions',
        image: 'https://source.unsplash.com/random/400x200/?technology',
        description: 'Modern technology solutions for smart farming.',
        address: '456 Tech Road, Kandy',
        phone: '+94 77 987 6543',
        email: 'support@farmtech.lk',
        categoryId: 'category_equipment',
        products: [],
        rating: 4.2,
        reviews: 18,
        openingHours: '9:00 AM - 5:00 PM',
        location: {
          latitude: 7.2906,
          longitude: 80.6337
        }
      },
      {
        id: getRandomId(),
        name: 'Green Harvest Store',
        image: 'https://source.unsplash.com/random/400x200/?harvest',
        description: 'Everything you need for a successful harvest season.',
        address: '789 Harvest Avenue, Galle',
        phone: '+94 77 456 7890',
        email: 'contact@greenharvest.lk',
        categoryId: 'category_fertilizers',
        products: [],
        rating: 4.7,
        reviews: 32,
        openingHours: '7:30 AM - 7:00 PM',
        location: {
          latitude: 6.0535,
          longitude: 80.2210
        }
      }
    ];
    
    for (const shop of sampleShops) {
      const docRef = doc(shopsRef, shop.id);
      await setDoc(docRef, shop);
      console.log(`Added shop: ${shop.name}`);
    }
    
    console.log('Sample shops added successfully');
  } catch (error) {
    console.error('Error seeding shops collection:', error);
    throw error;
  }
};

// Machine related utility functions
export const getMachineCategories = async (): Promise<Category[]> => {
  try {
    // You can either:
    // 1. Fetch from a dedicated 'machineCategories' collection if you have one
    // 2. Return a fixed set of machine categories
    // 3. Filter the general categories collection
    
    // For this implementation, let's use fixed categories:
    const machineCategories: Category[] = [
      { id: '1', name: 'Tractors', icon: '🚜', image: 'https://media.istockphoto.com/id/1320356772/photo/tractor-and-agricultural-machinery-on-the-field.jpg' },
      { id: '2', name: 'Harvesters', icon: '🌾', image: 'https://www.shutterstock.com/image-photo/combine-harvester-on-the-field-600w-2303655055.jpg' },
      { id: '3', name: 'Irrigation', icon: '💧', image: 'https://www.shutterstock.com/image-photo/irrigation-system-watering-corn-field-600w-1402678828.jpg' },
      { id: '4', name: 'Seeders', icon: '🌱', image: 'https://www.shutterstock.com/image-photo/tractor-seeding-crops-field-600w-1123239710.jpg' },
      { id: '5', name: 'Storage', icon: '🏢', image: 'https://www.shutterstock.com/image-photo/grain-silos-storage-tanks-600w-1432692355.jpg' },
      { id: '6', name: 'Other', icon: '🔧', image: 'https://www.shutterstock.com/image-photo/agricultural-machinery-600w-1045842635.jpg' },
    ];
    
    return machineCategories;
  } catch (error) {
    console.error('Error getting machine categories:', error);
    // Return empty array in case of error
    return [];
  }
};

export const getMachinesByCategoryId = async (categoryId: string): Promise<Machine[]> => {
  try {
    // Query machines collection filtering by categoryId
    const machinesQuery = query(
      collection(db, 'machines'),
      where('category', '==', categoryId),
      orderBy('createdAt', 'desc')
    );
    
    const machineSnapshot = await getDocs(machinesQuery);
    const machines: Machine[] = [];
    
    machineSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Format dates properly
      const createdAt = data.createdAt ? 
        (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : 
        new Date();
      
      const updatedAt = data.updatedAt ? 
        (data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt) : 
        new Date();
      
      machines.push({
        id: doc.id,
        name: data.name || '',
        price: data.price || 0,
        description: data.description || '',
        category: data.category || '',
        status: data.status || 'unavailable',
        contact: data.contact || '',
        phone: data.phone || '',
        location: data.location || '',
        image: data.image || '',
        createdAt: createdAt,
        updatedAt: updatedAt
      });
    });
    
    return machines;
  } catch (error) {
    console.error('Error getting machines by category:', error);
    return [];
  }
};

export const getAllMachines = async (limitCount: number = 10): Promise<Machine[]> => {
  try {
    // Query all machines, limited by count
    const machinesQuery = query(
      collection(db, 'machines'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const machineSnapshot = await getDocs(machinesQuery);
    const machines: Machine[] = [];
    
    machineSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Format dates properly
      const createdAt = data.createdAt ? 
        (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : 
        new Date();
      
      const updatedAt = data.updatedAt ? 
        (data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt) : 
        new Date();
      
      machines.push({
        id: doc.id,
        name: data.name || '',
        price: data.price || 0,
        description: data.description || '',
        category: data.category || '',
        status: data.status || 'unavailable',
        contact: data.contact || '',
        phone: data.phone || '',
        location: data.location || '',
        image: data.image || '',
        createdAt: createdAt,
        updatedAt: updatedAt
      });
    });
    
    return machines;
  } catch (error) {
    console.error('Error getting all machines:', error);
    return [];
  }
};

// Add machine upload function with image handling
export const addMachine = async (machineData: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Make sure the image is in a supported format
    let imageToSave = machineData.image;
    
    // If image is a local file URI, use a fallback URL
    if (typeof imageToSave === 'string' && imageToSave.startsWith('file:///')) {
      console.warn('Local file URI detected. Using a public URL instead.');
      imageToSave = 'https://media.istockphoto.com/id/1320356772/photo/tractor-and-agricultural-machinery-on-the-field.jpg';
    }
    
    // Create the machine document with the processed image
    const machineDoc = {
      ...machineData,
      image: imageToSave,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'machines'), machineDoc);
    console.log('Machine added with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding machine:', error);
    throw error;
  }
}; 