import "../styles/ListItem.css";
const ListItem = () => {
  return (
    <>
      <div className="list-item ">
        <div className="image-container">
          <img src="/public/Scapular.jpeg.avif" alt="picture of Scapular" />
        </div>
        <h5 className="item-title">
          Our Lady of Mount Carmel Embroidered small brown Scapular: Catholic
          Devotional
        </h5>
        <p className="item-price">$10</p>
      </div>
    </>
  );
};

export default ListItem;
