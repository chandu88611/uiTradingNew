// Router.tsx
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { publicRoutes, userProtectedRoutes } from "./routes";

import PublicLayout from "./layouts/PublicLayout";
import RequireUserAuth from "./RequireAuth";

const Skeleton = () => <div>Loading…</div>;

const Router = () => {
  return (
    <Routes>
      {/* Everything under "/" uses PublicLayout */}
      <Route path="/" element={<PublicLayout />}>
        {/* "/" -> Home (because publicRoutes has path: "" → index) */}
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

        {/* Protected routes under "/" */}
        <Route element={<RequireUserAuth />}>
          {userProtectedRoutes.map((route, i) => (
            <Route
              key={`user-${i}`}
              path={route.path}
              element={
                <Suspense fallback={<Skeleton />}>
                  <route.element />
                </Suspense>
              }
            />
          ))}
        </Route>
      </Route>

      {/* 404 → go to home ("/") */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default Router;
