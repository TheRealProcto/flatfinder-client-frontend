import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Home from "./pages/Home";
import CreateFlat from "./pages/CreateFlat";
import EditFlat from "./pages/EditFlat";
import FlatDetails from "./pages/FlatDetails";
import Favourites from "./pages/Favourites";
import MessagesInbox from "./pages/MessagesInbox";
import MessagesThread from "./pages/MessagesThread";

import AdminUsers from "./pages/AdminUsers";

import { PrivateRoute } from "./routes/PrivateRoute";
import { PublicRoute } from "./routes/PublicRoute";
import { AdminRoute } from "./routes/AdminRoute";

import AppShell from "./layout/AppShell";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Privadas */}
        <Route element={<PrivateRoute />}>
          {/* AppShell como layout das privadas */}
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/flats/new" element={<CreateFlat />} />
            <Route path="/flats/:id" element={<FlatDetails />} />
            <Route path="/flats/:id/edit" element={<EditFlat />} />
            <Route path="/favourites" element={<Favourites />} />
            <Route path="/messages" element={<MessagesInbox />} />
            <Route path="/messages/:flatId/:otherUserId" element={<MessagesThread />} />

            {/* Admin dentro do Shell */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
