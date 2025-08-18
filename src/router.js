
import Launchpad from "./pages/launchpad/launchpad";
import Task from "./pages/task/task";

const routes = [
  {
    path: "/",
    element: <Task/>,
  },
    {
    path: "/launchpad",
    element: <Launchpad/>,
  }
  
];
export default routes;