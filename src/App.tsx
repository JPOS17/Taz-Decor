import TopBar from "./components/shared/TopBar";
import Footer from "./footer/Footer";
import AppRoutes from "./routes/AppRoutes";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div>
          <TopBar />
          <AppRoutes />
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;