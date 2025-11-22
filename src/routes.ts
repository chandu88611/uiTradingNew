import { lazy } from "react"; 
type AnyCmp = React.ComponentType<any>;
type LazyAnyCmp = React.LazyExoticComponent<AnyCmp>;
export type AppRoute = { path: string; element: AnyCmp | LazyAnyCmp };

// PUBLIC
const Home = lazy(() => import("./pages/public/Landing"));
const About = lazy(() => import("./pages/public/Contact"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassowrd = lazy(() => import("./pages/auth/ResetPassowrd"));
const dashboard = lazy(() => import("./pages/dashboard/MyAccounts"));

// USER PAGES
const UserProfile = lazy(() => import("./pages/user/UserProfile"));

// USER BROKER FLOW
const UserBrokers = lazy(() => import("./pages/user/Dashboard"));
const UserBrokerConnect = lazy(() => import("./pages/user/Brokers"));
const UserBrokerSuccess = lazy(() => import("./pages/user/BrokerSuccessPage"));
// const UserBrokerError = lazy(() => import("./pages/user/BrokerErrorPage"));
const UserBrokerManage = lazy(() => import("./pages/user/BrokerManagePage"));
const Conditions = lazy(() => import("./pages/user/Conditions"));


// USER SUBSCRIPTION PAGES
const SubscriptionPlans = lazy(() => import("./pages/subscriptions/Subscriptions"));
const SubscriptionTerms = lazy(() => import("./pages/subscriptions/SubscriptionTerms"));
const SubscriptionBilling = lazy(() => import("./pages/subscriptions/SubscriptionBilling"));
const SubscriptionSuccess = lazy(() => import("./pages/subscriptions/SubscriptionSuccess"));
const SubscriptionDashboard = lazy(() => import("./pages/subscriptions/SubscriptionDashboard"));
const SubscriptionSettlements = lazy(() => import("./pages/subscriptions/Settlements"));
const SubscriptionInvoices = lazy(() => import("./pages/subscriptions/Invoices"));
const SubscriptionInvoiceDetail = lazy(() => import("./pages/subscriptions/InvoiceDetailPage"));
const RiskSettingsPage = lazy(() => import("./pages/user/RiskSettingsPage"));
const SmartPositionSizingPage = lazy(() => import("./pages/user/SmartPositionSizingPage"));


const TradeLogs = lazy(() => import("./pages/user/TradeHistoryPage"));
const OrderLogs = lazy(() => import("./pages/user/LivePositionsPage"));
// const WebhookLogs = lazy(() => import("./pages/user/WebhookLogs"));

// ADMIN ROUTES
const TradingAccounts = lazy(() => import("./pages/admin/Accounts"));
const Strategy = lazy(() => import("./pages/admin/Strategy"));
const TradingViewIndicators = lazy(() => import("./pages/admin/Tradingview"));
const Subscribers = lazy(() => import("./pages/admin/copy-trading/Subscribers"));
const CopySettings = lazy(() => import("./pages/admin/copy-trading/CopySettings"));
const StrategyLinking = lazy(() => import("./pages/admin/copy-trading/StrategyLinking"));
const FanoutSettings = lazy(() => import("./pages/admin/copy-trading/FanoutSettings"));
const LiveTradingPage = lazy(() => import("./pages/admin/copy-trading/LiveTrading"));
const CopyTradingStatus = lazy(() => import("./pages/admin/copy-trading/CopyTradingStatus"));
const Subscriptions = lazy(() => import("./pages/admin/subscriptions/BillingSubscriptionPage"));
const BillingDashboard = lazy(() => import("./pages/admin/dashboard/BillingDashboard"));

// ------------------------
// PUBLIC ROUTES
// ------------------------
export const publicRoutes: AppRoute[] = [
  { path: "/", element: Home },
  { path: "/about", element: About },
  { path: "/sign-in", element: SignIn },
  { path: "/sign-up", element: SignUp },
  { path: "/forgot-password", element: ForgotPassword },
  { path: "/reset-password", element: ResetPassowrd },
  { path: "/dashboard", element: dashboard },

  // user
  { path: "/profile", element: UserProfile },

  // user broker flow
  { path: "/user/brokers", element: UserBrokers },
  { path: "/user/brokers/connect/:broker", element: UserBrokerConnect },
  { path: "/user/brokers/success/:broker", element: UserBrokerSuccess },
  { path: "/user/brokers/manage/:broker", element: UserBrokerManage },
    { path: "/user/logs/trades", element: TradeLogs },
  { path: "/user/logs/orders", element: OrderLogs },
  { path: "/user/settings", element: RiskSettingsPage },
  { path: "/user/smart-positioning", element: SmartPositionSizingPage },
  { path: "/user/conditions", element: Conditions },

  // { path: "/user/logs/webhooks", element: WebhookLogs },

  // admin
  { path: "/trading-accounts", element: TradingAccounts },
  { path: "/strategy", element: Strategy },
  { path: "/tradingview-indicators", element: TradingViewIndicators },
  { path: "/subscribers", element: Subscribers },
  { path: "/master-control", element: CopySettings },
  { path: "/strategy-linking", element: StrategyLinking },
  { path: "/fanout-settings", element: FanoutSettings },
  { path: "/live-trading", element: LiveTradingPage },
  { path: "/live-trading-status", element: CopyTradingStatus },
  { path: "/subscriptions", element: Subscriptions },
  { path: "/billing-dashboard", element: BillingDashboard },


    // SUBSCRIPTIONS (USER)
  { path: "/subscriptions", element: SubscriptionPlans },
  { path: "/subscriptions/terms", element: SubscriptionTerms },
  { path: "/subscriptions/billing", element: SubscriptionBilling },
  { path: "/subscriptions/success", element: SubscriptionSuccess },
  { path: "/subscriptions/dashboard", element: SubscriptionDashboard },
  { path: "/subscriptions/settlements", element: SubscriptionSettlements },
  { path: "/subscriptions/invoices", element: SubscriptionInvoices },
  { path: "/subscriptions/invoices/:id", element: SubscriptionInvoiceDetail },

];



// ------------------------
// ADMIN PROTECTED ROUTES
// ------------------------
export const adminProtectedRoutes: AppRoute[] = [
  { path: "/trading-accounts", element: TradingAccounts },
  { path: "/strategy", element: Strategy }, 
  { path: "/tradingview-indicators", element: TradingViewIndicators },
  { path: "/fanout-settings", element: FanoutSettings },
  { path: "/live-trading", element: LiveTradingPage },
  { path: "/live-trading-status", element: CopyTradingStatus },
  { path: "/billing-dashboard", element: BillingDashboard },
];

// ------------------------
// USER PROTECTED ROUTES
// ------------------------
export const userProtectedRoutes: AppRoute[] = [
  { path: "/profile", element: UserProfile },

  // FULL broker system for users
  { path: "/user/brokers", element: UserBrokers },
  { path: "/user/brokers/connect/:broker", element: UserBrokerConnect },
  { path: "/user/brokers/success/:broker", element: UserBrokerSuccess },
  { path: "/user/brokers/manage/:broker", element: UserBrokerManage },

    { path: "/user/logs/trades", element: TradeLogs },
  { path: "/user/logs/orders", element: OrderLogs },
  // { path: "/user/logs/webhooks", element: WebhookLogs },
];
