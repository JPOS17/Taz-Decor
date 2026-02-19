import TopBar from "./components/universalComponents/TopBar";
import Footer from "./footer/Footer";
import AppRoutes from "./routes/AppRoutes";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div>
          <div>
            <TopBar />
          </div>
          <div>
            <AppRoutes />
          </div>
          <div>
            <Footer />
          </div>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
