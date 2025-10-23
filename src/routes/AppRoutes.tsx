import { Routes, Route } from "react-router";

import Home from "../pages/Home";
import Features from "../pages/Features";
import Pricing from "../pages/Pricing";
import Cart from "../pages/Cart";
import Profile from "../pages/Profile";
import WishList from "../pages/WishList";
import SearchResults from "../pages/SearchResults";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/Features" element={<Features />} />
      <Route path="/Pricing" element={<Pricing />} />
      <Route path="/Cart" element={<Cart />} />
      <Route path="/WishList" element={<WishList />} />
      <Route path="/Profile" element={<Profile />} />
      <Route path="/Search" element={<SearchResults />} />
    </Routes>
  );
};

export default AppRoutes;
