import { useState } from "react";
import "../styles/ListItem.css";
import ListItem from "../components/ListItem";
import SideBar from "../components/SideBar";

// each elem is just a plain object
const allItems = [
  {
    id: 1,
    name: "Our Lady Poster",
    category: "Our Lady of Guadalupe",
    price: "$10",
    img: "/public/images/Scapular.jpeg.avif",
  },
  {
    id: 2,
    name: "Men's Hoodie",
    category: "Mens",
    price: "$5",
    img: "/public/images/San_Anthony.avif",
  },
  {
    id: 3,
    name: "Women's Scarf",
    category: "Womens",
    price: "$4",
    img: "/public/images/San_Jose.avif",
  },
  {
    id: 4,
    name: "Kids Tee",
    category: "Kids",
    price: "$9",
    img: "/public/images/Tote.webp",
  },
];

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  /* filter mechanism */

  const filteredItems =
    activeCategory === "All"
      ? allItems
      : allItems.filter((item) => item.category === activeCategory);

  return (
    <>
      <div className="container-fluid">
        <div className="row">
          <div className="col-auto p-0 ">
            {/* passes two props, activeCategory for current, onSelectCategory gives sidebar way to change */}

            <SideBar
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          </div>
          <div className="col p-0">
            <div className=" ms-4 mt-2">
              <h3>{activeCategory}</h3>
            </div>
            <div className=" listings-grid">
              {filteredItems.map((item) => (
                // item={item} causes object to wrap onto another object (make sure to de-wrap) because its nested

                <ListItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
