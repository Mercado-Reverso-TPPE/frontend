import { createBrowserRouter } from "react-router";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import CreateAd from "./pages/CreateAd";
import MyAds from "./pages/MyAds";
import AdDetail from "./pages/AdDetail";
import MakeOffer from "./pages/MakeOffer";
import ReceivedOffers from "./pages/ReceivedOffers";
import CounterOffer from "./pages/CounterOffer";
import AcceptOffer from "./pages/AcceptOffer";
import Chat from "./pages/Chat";
import ConcludeNegotiation from "./pages/ConcludeNegotiation";
import Notifications from "./pages/Notifications";
import Review from "./pages/Review";
import History from "./pages/History";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Home },
      { path: "profile", Component: Profile },
      { path: "create-ad", Component: CreateAd },
      { path: "my-ads", Component: MyAds },
      { path: "ad/:adId", Component: AdDetail },
      { path: "ad/:adId/offer", Component: MakeOffer },
      { path: "ad/:adId/offers", Component: ReceivedOffers },
      { path: "ad/:adId/offers/:offerId/counter", Component: CounterOffer },
      { path: "accept/:offerId", Component: AcceptOffer },
      { path: "chat/:chatId", Component: Chat },
      { path: "conclude/:chatId", Component: ConcludeNegotiation },
      { path: "notifications", Component: Notifications },
      { path: "review/:chatId", Component: Review },
      { path: "history", Component: History },
    ],
  },
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { path: "login", Component: Login },
      { path: "register", Component: Register },
    ],
  },
]);
