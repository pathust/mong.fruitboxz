import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { AdminAuthProvider } from './context/AdminAuthContext'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLoginCheck from './components/admin/AdminLoginCheck'

const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Categories = lazy(() => import('./pages/Categories'))
const CategoryDetail = lazy(() => import('./pages/CategoryDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Account = lazy(() => import('./pages/Account'))
const OrderHistory = lazy(() => import('./pages/OrderHistory'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Contact = lazy(() => import('./pages/Contact'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Search = lazy(() => import('./pages/Search'))
const CustomBox = lazy(() => import('./pages/CustomBox'))
const PaymentPolicy = lazy(() => import('./pages/PaymentPolicy'))
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const FinanceDashboard = lazy(() => import('./pages/admin/finance/FinanceDashboard'))
const CustomersList = lazy(() => import('./pages/admin/customers/CustomersList'))
const CustomerDetail = lazy(() => import('./pages/admin/customers/CustomerDetail'))
const PromotionsList = lazy(() => import('./pages/admin/promotions/PromotionsList'))
const InventoryList = lazy(() => import('./pages/admin/inventory/InventoryList'))
const ProductsList = lazy(() => import('./pages/admin/products/ProductsList'))
const ProductForm = lazy(() => import('./pages/admin/products/ProductForm'))
const CategoriesList = lazy(() => import('./pages/admin/categories/CategoriesList'))
const CategoryForm = lazy(() => import('./pages/admin/categories/CategoryForm'))
const BannersList = lazy(() => import('./pages/admin/banners/BannersList'))
const BannerForm = lazy(() => import('./pages/admin/banners/BannerForm'))
const OrdersList = lazy(() => import('./pages/admin/orders/OrdersList'))
const OrderDetail = lazy(() => import('./pages/admin/orders/OrderDetail'))
const ShippingSettings = lazy(() => import('./pages/admin/settings/ShippingSettings'))
const UsersList = lazy(() => import('./pages/admin/UsersList'))
const RolesList = lazy(() => import('./pages/admin/RolesList'))
const PermissionsList = lazy(() => import('./pages/admin/PermissionsList'))
const ReviewsList = lazy(() => import('./pages/admin/ReviewsList'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const CostSettings = lazy(() => import('./pages/admin/costs/CostSettings'))
const IngredientsList = lazy(() => import('./pages/admin/costs/IngredientsList'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const MediaLibrary = lazy(() => import('./pages/admin/MediaLibrary'))
const SearchConsole = lazy(() => import('./pages/admin/SearchConsole'))
const ChatbotConsole = lazy(() => import('./pages/admin/ChatbotConsole'))
const BlogPostsList = lazy(() => import('./pages/admin/blog/BlogPostsList'))
const BlogPostForm = lazy(() => import('./pages/admin/blog/BlogPostForm'))
const ContentSettingsPage = lazy(() => import('./pages/admin/content/ContentSettingsPage'))

function ScreenLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

function PublicPage({ children }) {
  return <Layout><Suspense fallback={<ScreenLoader />}>{children}</Suspense></Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage><Home /></PublicPage>} />
      <Route path="/products" element={<PublicPage><Products /></PublicPage>} />
      <Route path="/products/:slug" element={<PublicPage><ProductDetail /></PublicPage>} />
      <Route path="/categories" element={<PublicPage><Categories /></PublicPage>} />
      <Route path="/categories/:categorySlug" element={<PublicPage><CategoryDetail /></PublicPage>} />
      <Route path="/cart" element={<PublicPage><Cart /></PublicPage>} />
      <Route path="/checkout" element={<PublicPage><Checkout /></PublicPage>} />
      <Route path="/auth/login" element={<PublicPage><Login /></PublicPage>} />
      <Route path="/auth/register" element={<PublicPage><Register /></PublicPage>} />
      <Route path="/account" element={<PublicPage><Account /></PublicPage>} />
      <Route path="/order-history" element={<PublicPage><OrderHistory /></PublicPage>} />
      <Route path="/about-us" element={<PublicPage><AboutUs /></PublicPage>} />
      <Route path="/contact" element={<PublicPage><Contact /></PublicPage>} />
      <Route path="/blog" element={<PublicPage><Blog /></PublicPage>} />
      <Route path="/blog/:id" element={<PublicPage><BlogPost /></PublicPage>} />
      <Route path="/search" element={<PublicPage><Search /></PublicPage>} />
      <Route path="/custom-box/:slug" element={<PublicPage><CustomBox /></PublicPage>} />
      <Route path="/payment-policy" element={<PublicPage><PaymentPolicy /></PublicPage>} />
      <Route path="/shipping-policy" element={<PublicPage><ShippingPolicy /></PublicPage>} />
      <Route path="/privacy-policy" element={<PublicPage><PrivacyPolicy /></PublicPage>} />

      <Route path="/admin" element={<AdminAuthProvider><AdminLoginCheck /></AdminAuthProvider>}>
        <Route path="login" element={<Suspense fallback={<ScreenLoader />}><AdminLogin /></Suspense>} />
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Suspense fallback={<ScreenLoader />}><AdminDashboard /></Suspense>} />
          <Route path="finance" element={<Suspense fallback={<ScreenLoader />}><FinanceDashboard /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<ScreenLoader />}><CustomersList /></Suspense>} />
          <Route path="customers/:id" element={<Suspense fallback={<ScreenLoader />}><CustomerDetail /></Suspense>} />
          <Route path="promotions" element={<Suspense fallback={<ScreenLoader />}><PromotionsList /></Suspense>} />
          <Route path="inventory" element={<Suspense fallback={<ScreenLoader />}><InventoryList /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<ScreenLoader />}><ProductsList /></Suspense>} />
          <Route path="products/new" element={<Suspense fallback={<ScreenLoader />}><ProductForm /></Suspense>} />
          <Route path="products/:id" element={<Suspense fallback={<ScreenLoader />}><ProductForm /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={<ScreenLoader />}><CategoriesList /></Suspense>} />
          <Route path="categories/new" element={<Suspense fallback={<ScreenLoader />}><CategoryForm /></Suspense>} />
          <Route path="categories/:id" element={<Suspense fallback={<ScreenLoader />}><CategoryForm /></Suspense>} />
          <Route path="banners" element={<Suspense fallback={<ScreenLoader />}><BannersList /></Suspense>} />
          <Route path="banners/new" element={<Suspense fallback={<ScreenLoader />}><BannerForm /></Suspense>} />
          <Route path="banners/:id" element={<Suspense fallback={<ScreenLoader />}><BannerForm /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<ScreenLoader />}><OrdersList /></Suspense>} />
          <Route path="orders/:id" element={<Suspense fallback={<ScreenLoader />}><OrderDetail /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<ScreenLoader />}><UsersList /></Suspense>} />
          <Route path="roles" element={<Suspense fallback={<ScreenLoader />}><RolesList /></Suspense>} />
          <Route path="permissions" element={<Suspense fallback={<ScreenLoader />}><PermissionsList /></Suspense>} />
          <Route path="reviews" element={<Suspense fallback={<ScreenLoader />}><ReviewsList /></Suspense>} />
          <Route path="ingredients" element={<Suspense fallback={<ScreenLoader />}><IngredientsList /></Suspense>} />
          <Route path="settings/shipping" element={<Suspense fallback={<ScreenLoader />}><ShippingSettings /></Suspense>} />
          <Route path="settings/costs" element={<Suspense fallback={<ScreenLoader />}><CostSettings /></Suspense>} />
          <Route path="media" element={<Suspense fallback={<ScreenLoader />}><MediaLibrary /></Suspense>} />
          <Route path="search" element={<Suspense fallback={<ScreenLoader />}><SearchConsole /></Suspense>} />
          <Route path="chatbot" element={<Suspense fallback={<ScreenLoader />}><ChatbotConsole /></Suspense>} />
          <Route path="blog" element={<Suspense fallback={<ScreenLoader />}><BlogPostsList /></Suspense>} />
          <Route path="blog/new" element={<Suspense fallback={<ScreenLoader />}><BlogPostForm /></Suspense>} />
          <Route path="blog/:id" element={<Suspense fallback={<ScreenLoader />}><BlogPostForm /></Suspense>} />
          <Route path="content/about" element={<Suspense fallback={<ScreenLoader />}><ContentSettingsPage type="about" /></Suspense>} />
          <Route path="content/contact" element={<Suspense fallback={<ScreenLoader />}><ContentSettingsPage type="contact" /></Suspense>} />
          <Route path="content/custom-box" element={<Suspense fallback={<ScreenLoader />}><ContentSettingsPage type="customBox" /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<ScreenLoader />}><Settings /></Suspense>} />
        </Route>
      </Route>
    </Routes>
  )
}
