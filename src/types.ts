export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  quantity?: number;
  rating?: number;
  shopId?: string;
  shopName?: string;
  location?: string;
  unit?: string;
  sellerEmail?: string;
  sellerName?: string;
  status?: string;
  additionalImages?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  products: Product[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  date: Date;
}

export interface Weather {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  date: Date;
  icon?: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  author: string;
  date: Date;
  tags: string[];
}

export interface MarketPrice {
  id: string;
  productName: string;
  price: number;
  market: string;
  date: Date;
}

export interface Bid {
  id?: string;
  name: string;
  number: string;
  category: string;
  item: string;
  description: string;
  startPrice: number;
  startDate: Date;
  dueDate: Date;
  email: string;
  imageUri: string;
  status: 'active' | 'closed' | 'sold';
  createdAt: Date;
  bids: BidOffer[];
}

export interface BidOffer {
  id: string;
  bidId: string;
  amount: number;
  email: string;
  createdAt: Date;
}

export interface Shop {
  id: string;
  name: string;
  categoryId: string;
  owner: string;
  phone: string;
  whatsapp?: string;
  address: string;
  description: string;
  image: string;
  products?: string[]; // Array of product IDs
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Machine {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  status: string;
  contact: string;
  phone: string;
  location?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  LanguageSelection: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  ProductDetails: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  Profile: undefined;
  EditProfile: undefined;
  Orders: undefined;
  OrderDetails: { orderId: string };
  Settings: undefined;
  About: undefined;
  Help: undefined;
  Weather: undefined;
  MarketPrices: undefined;
  Articles: undefined;
  ArticleDetails: { articleId: string };
  Categories: undefined;
  Products: { categoryId?: string };
  OrderHistory: undefined;
  BidDetails: { bidId: string };
  MyOffers: undefined;
  ProductCategories: undefined;
  AddProduct: { preselectedCategoryId?: string; categoryName?: string } | undefined;
  ShopsList: { categoryId: string };
  ShopDetails: { shopId: string };
  MachineCategories: undefined;
  MachineList: { categoryId: string; categoryName: string };
  AddMachine: { preselectedCategoryId?: string; categoryName?: string } | undefined;
  MachineDetails: { machineId: string };
  Home: undefined;
  ChangePassword: undefined;
  EditMachine: { machineId: string };
  ProductsList: { categoryId: string; categoryName: string };
  NewsAndTips: undefined;
  PestAndDiseaseControl: undefined;
  PestDetails: { pestId: string; type: string };
}; 