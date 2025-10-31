import "../styles/ListItem.css";

// content of object
interface item {
  id: number;
  name: string;
  category: string;
  price: string;
  img: string;
}

// dewrap
interface ListItemProps {
  item: item;
}

const ListItem = ({ item }: ListItemProps) => {
  return (
    <div className="list-item">
      <div className="image-container">
        <img src={item.img} alt={item.name} />
      </div>

      <h5 className="item-title">{item.name}</h5>
      <p className="item-price">{item.price}</p>
    </div>
  );
};

export default ListItem;
