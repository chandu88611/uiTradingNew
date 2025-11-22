import { Suspense, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { publicRoutes } from "./routes";
 
import { useDispatch, useSelector } from "react-redux"; 
import { toast } from "react-toastify";
import PublicLayout from "./layouts/PublicLayout";
 const Skeleton = () => <div>Loading…</div>

const Router = () => {
  
const navigate=useNavigate()
const dispatch=useDispatch()
 
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        {publicRoutes.map((route, i) => (
          <Route
            key={`public-${i}`}
            path={route.path}
            element={
              <Suspense fallback={<Skeleton />}>
                <route.element />
              </Suspense>
            }
          />
        ))}
      </Route>

    

      {/* Admin Routes */}
      {/* {userRole?.user?.role === "admin" && (
        <Route path="/admin" element={<AdminLayout />}>
          {adminRoutes.map((route, i) => (
            <Route
              key={`admin-${i}`}
              path={route.path}
              element={
                <Suspense fallback={<Skeleton />}>
                  <route.element />
                </Suspense>
              }
            />
          ))}
        </Route>
      )} */}

 
    </Routes>
  );
};

export default Router;