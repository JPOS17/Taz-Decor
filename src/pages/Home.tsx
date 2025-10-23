import ListItem from "../components/ListItem";
import SideBar from "../components/SideBar";
import "../styles/ListItem.css";

const Home = () => {
  return (
    <>
      <div className="container-fluid">
        {/* <div className="row">
          <div className="col text-center"> hi</div>
        </div> */}

        <div className="row">
          <div className="col-auto p-0 ">
            <SideBar />
          </div>

          <div className="col p-0">
            <div className=" ms-4 mt-1">
              <h3>This is what we are selling:</h3>
            </div>

            <div className=" listings-grid">
              <ListItem />
              <ListItem />
              <ListItem />
              <ListItem />
              <ListItem />
              <ListItem />
              <ListItem />
              <ListItem />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
