// routes.ts
import React, { lazy } from "react";

type AnyCmp = React.ComponentType<any>;
type LazyAnyCmp = React.LazyExoticComponent<AnyCmp>;
export type AppRoute = { path: string; element: AnyCmp | LazyAnyCmp };

// ------------------------
// LAZY IMPORTS
// ------------------------

// PUBLIC
const Home = lazy(() => import("./pages/public/Landing"));
const About = lazy(() => import("./pages/public/Contact"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassowrd = lazy(() => import("./pages/auth/ResetPassowrd"));

// USER DASHBOARD
const Dashboard = lazy(() => import("./pages/dashboard/MyAccounts"));

// USER PAGES
const UserProfile = lazy(() => import("./pages/user/UserProfile"));
const StrategyConfigure = lazy(() => import("./pages/user/StrategyConfigure"));

const UserBrokers = lazy(() => import("./pages/user/Dashboard"));
const UserBrokerConnect = lazy(() => import("./pages/user/Brokers"));
const UserBrokerSuccess = lazy(() => import("./pages/user/BrokerSuccessPage"));
const UserBrokerManage = lazy(() => import("./pages/user/BrokerManagePage"));

const Conditions = lazy(() => import("./pages/user/Conditions"));
const RiskSettingsPage = lazy(() => import("./pages/user/settings/RiskSettingsPage"));
const SmartPositionSizingPage = lazy(() => import("./pages/user/SmartPositionSizingPage"));

const TradeLogs = lazy(() => import("./pages/user/TradeHistoryPage"));
const OrderLogs = lazy(() => import("./pages/user/LivePositionsPage"));

// COPY TRADING (user side)
// const CopyTrading = lazy(() => import("./pages/copytrading/CopyTrading2"));
const CopyTrading = lazy(() => import("./pages/user/copy/CopyTradingSettings"));

// USER SUBSCRIPTION PAGES
const Subscriptions = lazy(() => import("./pages/subscriptions/SubscriptionWizardPage"));

const ConnectBroker = lazy(() => import("./pages/brokers/ConnectIndiaBrokerPage"));

// TRADING PAGES (SPLIT)
const ForexTrading = lazy(() => import("./pages/user/forex/PineConnectorSettings"));
const IndianTrading = lazy(() => import("./pages/user/indianMarket/IndianMarketSettings"));
const CryptoTrading = lazy(() => import("./pages/user/crypto/CryptoDeltaSettings")); // ✅ NEW

const SubscriptionTerms = lazy(() => import("./pages/subscriptions/SubscriptionTerms"));
const SubscriptionBilling = lazy(() => import("./pages/subscriptions/SubscriptionBilling"));
const SubscriptionSuccess = lazy(() => import("./pages/subscriptions/SubscriptionSuccess"));
const SubscriptionDashboard = lazy(() => import("./pages/subscriptions/SubscriptionDashboard"));
const SubscriptionSettlements = lazy(() => import("./pages/subscriptions/Settlements"));
const SubscriptionInvoices = lazy(() => import("./pages/subscriptions/Invoices"));
const SubscriptionInvoiceDetail = lazy(() => import("./pages/subscriptions/InvoiceDetailPage"));
const SubscriptionPayment = lazy(() => import("./pages/subscriptions/SubscrptionPayment"));




const CopyTradingIndiaTrader = lazy(
  () => import("./pages/user/copy/india/CopyTradingIndiaTraderPage")
);

const CopyTradingIndiaFollower = lazy(
  () => import("./pages/user/copy/india/CopyTradingIndiaFollowerPage")
);
// USER PAGES
const PlanBillingPage = lazy(() => import("./pages/user/PlanBillingPage"));
const CopyTradingForexTrader = lazy(() => import("./pages/user/copy/forex/CopyTradingForexTraderPage"));
const CopyTradingForexFollower = lazy(() => import("./pages/user/copy/forex/CopyTradingForexFollowerPage"));

// ------------------------
// PUBLIC ROUTES (no login needed)
// ------------------------
export const publicRoutes: AppRoute[] = [
  { path: "/", element: Home },
  { path: "/about", element: About },

  // auth
  { path: "/sign-in", element: SignIn },
  { path: "/sign-up", element: SignUp },
  { path: "/forgot-password", element: ForgotPassword },
  { path: "/reset-password", element: ResetPassowrd },

  // pricing + broker connect
  { path: "/pricing", element: Subscriptions },
  { path: "/connect-broker", element: ConnectBroker },
];

// ------------------------
// USER PROTECTED ROUTES (must be logged in)
// ------------------------
export const userProtectedRoutes: AppRoute[] = [
  { path: "/dashboard", element: Dashboard },

  // profile (ONLY profile/billing/security now)
  { path: "/profile", element: UserProfile },

  { path: "/user/use-strategy", element: StrategyConfigure },

  // broker flow
  { path: "/user/brokers", element: UserBrokers },
  { path: "/user/brokers/connect/:broker", element: UserBrokerConnect },
  { path: "/user/brokers/success/:broker", element: UserBrokerSuccess },
  { path: "/user/brokers/manage/:broker", element: UserBrokerManage },

  // logs
  { path: "/user/logs/trades", element: TradeLogs },
  { path: "/user/logs/orders", element: OrderLogs },

  // settings
  { path: "/settings", element: RiskSettingsPage },
  { path: "/user/smart-positioning", element: SmartPositionSizingPage },
  { path: "/user/conditions", element: Conditions },

  // subscriptions
  { path: "/subscriptions/terms", element: SubscriptionTerms },
  { path: "/subscriptions/billing", element: SubscriptionBilling },
  { path: "/subscriptions/success", element: SubscriptionSuccess },
  { path: "/subscriptions/dashboard", element: SubscriptionDashboard },
  { path: "/subscriptions/settlements", element: SubscriptionSettlements },
  { path: "/subscriptions/invoices", element: SubscriptionInvoices },
  { path: "/subscriptions/invoices/:id", element: SubscriptionInvoiceDetail },
  { path: "/subscriptions/payment", element: SubscriptionPayment },

  // trading dashboards
  // { path: "/trading/dashboard", element: TradingDashboard },

  // ✅ split pages
  { path: "/forex-trading", element: ForexTrading },
  { path: "/indian-trading", element: IndianTrading },
  { path: "/crypto-trading", element: CryptoTrading }, // ✅ NEW

  { path: "/copy-trading", element: CopyTrading },

    { path: "/copy-trading/india/trader", element: CopyTradingIndiaTrader },
  { path: "/copy-trading/india/follower", element: CopyTradingIndiaFollower },

  { path: "/copy-trading/forex/trader", element: CopyTradingForexTrader },
{ path: "/copy-trading/forex/follower", element: CopyTradingForexFollower },

  { path: "/plan", element: PlanBillingPage },
];
