import TopBar from "./components/TopBar";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
      <div>
        <div>
          <TopBar />
        </div>
        <div>
          <AppRoutes />
        </div>
      </div>
    </>
  );
}

export default App;
